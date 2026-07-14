import { Request, Response } from 'express';
import { Fatura } from './fatura.model';
import { Assinatura } from './assinatura.model';
import { Pagamento } from './pagamento.model';
import { AjusteFinanceiro } from './ajuste_financeiro.model';
import { AuditoriaLog } from '../historico/auditoria_log.model';
import { Cliente } from '../clientes/cliente.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { HistoricoInstalacao } from '../historico/historico.model';

export const listFaturas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, clienteId } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (clienteId) query.clienteId = clienteId;

    const faturas = await Fatura.find(query)
      .populate('clienteId', 'nome documento whatsapp')
      .sort({ dataVencimento: 1 });

    res.status(200).json(faturas);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar faturas.', details: error.message });
  }
};

export const baixarFaturaManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const fatura = await Fatura.findById(id);
    if (!fatura) {
      res.status(404).json({ error: 'Fatura não encontrada.' });
      return;
    }

    if (fatura.status === 'PAGO') {
      res.status(400).json({ error: 'Esta fatura já foi paga anteriormente.' });
      return;
    }

    fatura.status = 'PAGO';
    fatura.dataPagamento = new Date();
    fatura.valorPago = fatura.valorTotal;
    await fatura.save();

    const protocoloId = `BXM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await Pagamento.create({
      faturaId: fatura._id,
      clienteId: fatura.clienteId,
      valor: fatura.valorTotal,
      metodoPagamento: 'TRANSFERENCIA',
      status: 'CONCLUIDO',
      protocolo: protocoloId,
      operador: 'Manual',
      dataPagamento: new Date()
    });

    await AuditoriaLog.create({
      entidade: 'FATURA',
      entidadeId: fatura._id,
      clienteId: fatura.clienteId,
      acao: 'BAIXA_MANUAL',
      descricao: `Baixa manual registrada na fatura`,
      operador: 'Sistema'
    });

    res.status(200).json({ message: 'Baixa manual registrada com sucesso.', mensalidade: fatura });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao dar baixa manual na fatura.', details: error.message });
  }
};

export const rodarFaturamentoAutomatico = async (req: Request, res: Response): Promise<void> => {
  try {
    const hoje = new Date();
    const assinaturas = await Assinatura.find({ status: 'ACTIVE' }).populate('planoId').populate('clienteId');
    let faturasGeradasCount = 0;

    for (const assinatura of assinaturas) {
      const cliente = assinatura.clienteId as any;
      const plano = assinatura.planoId as any;

      if (!cliente || !plano || !cliente.ativo) continue;

      const diaVencimento = assinatura.diaVencimento || 10; 
      const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
      
      if (dataVencimento < hoje) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      const inicioDiaVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate());
      const fimDiaVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate(), 23, 59, 59, 999);

      const faturaExistente = await Fatura.findOne({
        assinaturaId: assinatura._id,
        dataVencimento: { $gte: inicioDiaVencimento, $lte: fimDiaVencimento }
      });

      if (!faturaExistente) {
        const veiculos = await Veiculo.find({ clienteId: cliente._id }).select('_id');
        const veiculoIds = veiculos.map(v => v._id);
        
        const ativosHistoricos = await HistoricoInstalacao.find({
          veiculoId: { $in: veiculoIds },
          dataDesinstalacao: { $exists: false }
        });

        if (ativosHistoricos.length > 0) {
          let valorMensalidade = 0;
          let linhasFatura = [];
          
          const calcularValorOriginal = (count: number) => {
            if (plano.tipoCobranca === 'POR_VEICULO') return count * plano.valorBase;
            if (plano.tipoCobranca === 'FIXO_GLOBAL') return plano.valorBase;
            if (plano.tipoCobranca === 'ESCALONADO_FROTA') {
              const faixas = plano.faixasPreco || [];
              const faixa = faixas.find((f: any) => count >= f.de && (!f.ate || count <= f.ate));
              const valorUnitario = faixa ? faixa.valor : 80.00;
              return count * valorUnitario;
            }
            return count * 80.00;
          };

          const diasNoMes = new Date(inicioDiaVencimento.getFullYear(), inicioDiaVencimento.getMonth() + 1, 0).getDate();
          let veiculosCheios = 0;
          let valorFracionadoAdd = 0;

          ativosHistoricos.forEach(hist => {
            const dataInst = hist.dataInstalacao || assinatura.currentPeriodStart || new Date();
            const diffTime = Math.abs(inicioDiaVencimento.getTime() - dataInst.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            // Regra de Prorrateamento: 15 dias
            if (diffDays >= 15) {
               veiculosCheios++;
            } else {
               const valMensal = calcularValorOriginal(1); 
               const valorPorDia = valMensal / diasNoMes;
               const totalProporcional = valorPorDia * diffDays;
               
               valorFracionadoAdd += totalProporcional;
               linhasFatura.push({
                 descricao: `Rastreador Proporcional (Instalado a ${diffDays} dias do vencimento)`,
                 quantidade: 1,
                 valorUnitario: totalProporcional,
                 subtotal: totalProporcional
               });
            }
          });

          if (veiculosCheios > 0) {
            const valFull = calcularValorOriginal(veiculosCheios);
            valorMensalidade += valFull;
            linhasFatura.push({
               descricao: `Mensalidade Rastreador (${veiculosCheios}x)`,
               quantidade: veiculosCheios,
               valorUnitario: valFull / veiculosCheios,
               subtotal: valFull
            });
          }
          
          valorMensalidade += valorFracionadoAdd;

          // Desconto
          if (plano.descontoFidelidadePct > 0) {
            const desconto = valorMensalidade * (plano.descontoFidelidadePct / 100);
            valorMensalidade = valorMensalidade - desconto;
            linhasFatura.push({
               descricao: `Desconto de Fidelidade (${plano.descontoFidelidadePct}%)`,
               quantidade: 1,
               valorUnitario: -desconto,
               subtotal: -desconto
            });
          }

          const novaFatura = new Fatura({
            assinaturaId: assinatura._id,
            clienteId: cliente._id,
            dataVencimento: inicioDiaVencimento,
            dataEmissao: hoje,
            valorTotal: valorMensalidade,
            valorPago: 0,
            status: 'PENDENTE',
            linhas: linhasFatura
          });

          await novaFatura.save();
          faturasGeradasCount++;
        }
      }
    }

    res.status(200).json({
      message: 'Rotina de faturamento executada.',
      faturasGeradas: faturasGeradasCount
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao rodar faturamento automático.', details: error.message });
  }
};

export const createFaturaAvulsa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId, valor, dataVencimento, status, observacao } = req.body;

    if (!clienteId || !valor || !dataVencimento) {
      res.status(400).json({ error: 'Cliente, valor e data de vencimento são obrigatórios.' });
      return;
    }

    if (Number(valor) < 0) {
      res.status(400).json({ error: 'Valor não pode ser negativo.' });
      return;
    }
    
    // Procura a assinatura ativa
    const assinatura = await Assinatura.findOne({ clienteId: clienteId });
    if (!assinatura) {
        res.status(404).json({ error: 'Cliente não possui uma Assinatura base criada.' });
        return;
    }

    const novaFatura = new Fatura({
      assinaturaId: assinatura._id,
      clienteId,
      dataVencimento: new Date(dataVencimento),
      dataEmissao: new Date(),
      valorTotal: valor,
      status: status || 'PENDENTE',
      linhas: [{
        descricao: observacao || 'Lançamento Avulso',
        quantidade: 1,
        valorUnitario: valor,
        subtotal: valor
      }]
    });

    await novaFatura.save();

    await AuditoriaLog.create({
      entidade: 'FATURA',
      entidadeId: novaFatura._id,
      clienteId: clienteId,
      acao: 'CRIACAO_AVULSA',
      descricao: `Fatura avulsa criada no valor de ${valor}`,
      operador: 'Sistema'
    });

    // Mapeando a resposta para 'mensalidade' provisoriamente para nao quebrar frontend imediatamente
    res.status(201).json(novaFatura);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar fatura avulsa.', details: error.message });
  }
};

export const checkoutFatura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { desconto, acrescimo, valorPago, formaPagamento, novaDataVencimento } = req.body;

    const fatura = await Fatura.findById(id);
    if (!fatura) {
      res.status(404).json({ message: 'Fatura não encontrada' });
      return;
    }

    if (fatura.status === 'PAGO') {
      res.status(400).json({ message: 'A Fatura já está paga.' });
      return;
    }

    const valorOriginal = Number(fatura.valorTotal) || 0;
    const numDesconto = Number(desconto) || 0;
    const numAcrescimo = Number(acrescimo) || 0;
    const numPago = Number(valorPago) || 0;

    const totalDevido = valorOriginal + numAcrescimo - numDesconto;
    const protocoloId = `PGT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const dataHoje = new Date();
    
    if (numDesconto > 0) {
      await AjusteFinanceiro.create({
        faturaId: fatura._id,
        clienteId: fatura.clienteId,
        tipo: 'DESCONTO_MANUAL',
        valor: numDesconto,
        motivo: 'Desconto concedido no ato do checkout',
        operador: 'Operador',
        dataAjuste: dataHoje
      });
    }

    if (numAcrescimo > 0) {
      await AjusteFinanceiro.create({
        faturaId: fatura._id,
        clienteId: fatura.clienteId,
        tipo: 'MULTA',
        valor: numAcrescimo,
        motivo: 'Acréscimo aplicado no checkout',
        operador: 'Operador',
        dataAjuste: dataHoje
      });
    }

    if (numPago >= totalDevido) {
      fatura.status = 'PAGO';
      fatura.valorPago = numPago;
      fatura.dataPagamento = dataHoje;
      await fatura.save();

      await Pagamento.create({
        faturaId: fatura._id,
        clienteId: fatura.clienteId,
        valor: numPago,
        metodoPagamento: formaPagamento || 'TRANSFERENCIA',
        status: 'CONCLUIDO',
        protocolo: protocoloId,
        operador: 'Operador',
        dataPagamento: dataHoje
      });

      await AuditoriaLog.create({
        entidade: 'FATURA',
        entidadeId: fatura._id,
        clienteId: fatura.clienteId,
        acao: 'BAIXA_TOTAL',
        descricao: `Fatura liquidada com sucesso via ${formaPagamento}`,
        operador: 'Operador'
      });

      res.status(200).json({ message: 'Pagamento total registrado.', mensalidade: fatura });
    } else if (numPago > 0 && numPago < totalDevido) {
      const valorRestante = totalDevido - numPago;

      fatura.status = 'PARCIAL';
      fatura.valorPago = (fatura.valorPago || 0) + numPago;
      fatura.dataPagamento = dataHoje;
      await fatura.save();

      await Pagamento.create({
        faturaId: fatura._id,
        clienteId: fatura.clienteId,
        valor: numPago,
        metodoPagamento: formaPagamento || 'TRANSFERENCIA',
        status: 'CONCLUIDO',
        protocolo: protocoloId,
        operador: 'Operador',
        dataPagamento: dataHoje
      });

      await AuditoriaLog.create({
        entidade: 'FATURA',
        entidadeId: fatura._id,
        clienteId: fatura.clienteId,
        acao: 'BAIXA_PARCIAL',
        descricao: `Fatura paga parcialmente (${numPago}) via ${formaPagamento}`,
        operador: 'Operador'
      });

      if (!novaDataVencimento) {
        res.status(400).json({ message: 'Nova data de vencimento é obrigatória para pagamentos parciais.' });
        return;
      }

      const novaFatura = new Fatura({
        assinaturaId: fatura.assinaturaId,
        clienteId: fatura.clienteId,
        dataVencimento: new Date(novaDataVencimento),
        dataEmissao: dataHoje,
        valorTotal: valorRestante,
        status: 'PENDENTE',
        linhas: [{
          descricao: `Resíduo da fatura parcial (Protocolo ${protocoloId})`,
          quantidade: 1,
          valorUnitario: valorRestante,
          subtotal: valorRestante
        }]
      });

      await novaFatura.save();

      res.status(200).json({ 
        message: 'Pagamento parcial registrado. Nova fatura residual gerada com sucesso.', 
        mensalidadeOrigem: fatura, 
        mensalidadeNova: novaFatura 
      });
    } else {
      res.status(400).json({ message: 'Valor pago inválido.' });
    }

  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao processar checkout.', error: error.message });
  }
};

export const updateFatura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { valor, dataVencimento, status } = req.body;

    // Faturas são idealmente imutáveis, mas manteremos o endpoint pra editar dados básicos
    const fatura = await Fatura.findByIdAndUpdate(
      id,
      { valorTotal: valor, dataVencimento, status },
      { returnDocument: 'after' }
    );

    if (!fatura) {
      res.status(404).json({ message: 'Fatura não encontrada' });
      return;
    }
    
    await AuditoriaLog.create({
      entidade: 'FATURA',
      entidadeId: fatura._id,
      clienteId: fatura.clienteId,
      acao: 'EDICAO_DADOS',
      descricao: `Fatura editada manualmente`,
      operador: 'Operador'
    });

    res.status(200).json(fatura);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao atualizar fatura', error: error.message });
  }
};

export const deleteFatura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const fatura = await Fatura.findById(id);
    if (!fatura) {
      res.status(404).json({ message: 'Fatura não encontrada' });
      return;
    }
    
    // Idealmente não deletamos fatura (cancelamos), mas pra não quebrar fluxo mantemos
    await Fatura.findByIdAndDelete(id);

    await AuditoriaLog.create({
      entidade: 'FATURA',
      entidadeId: fatura._id,
      clienteId: fatura.clienteId,
      acao: 'DELECAO',
      descricao: `Fatura excluída manualmente`,
      operador: 'Operador'
    });

    res.status(200).json({ message: 'Mensalidade excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao excluir mensalidade', error: error.message });
  }
};

export const bulkDeleteFaturas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Nenhum ID fornecido.' });
      return;
    }

    const result = await Fatura.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: `${result.deletedCount} fatura(s) excluída(s) com sucesso.` });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao excluir lotes', error: error.message });
  }
};


export const bulkCheckoutFaturas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, formaPagamento } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Nenhum ID fornecido.' });
      return;
    }

    const hoje = new Date();
    
    // Processamento otimizado mas mantendo registro
    const faturas = await Fatura.find({ _id: { $in: ids }, status: { $ne: 'PAGO' } });
    
    for (const fat of faturas) {
       fat.status = 'PAGO';
       fat.dataPagamento = hoje;
       fat.valorPago = fat.valorTotal;
       await fat.save();

       const protocoloId = `BLK-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

       await Pagamento.create({
        faturaId: fat._id,
        clienteId: fat.clienteId,
        valor: fat.valorTotal,
        metodoPagamento: formaPagamento || 'TRANSFERENCIA',
        status: 'CONCLUIDO',
        protocolo: protocoloId,
        operador: 'Operador (Em Massa)',
        dataPagamento: hoje
      });
    }

    res.status(200).json({ message: `${faturas.length} faturas liquidadas com sucesso.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao liquidar faturas em massa.', details: error.message });
  }
};
