import { Request, Response } from 'express';
import { Mensalidade } from './mensalidade.model';
import { Cliente } from '../clientes/cliente.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { HistoricoInstalacao } from '../historico/historico.model';
import { Plano } from '../planos/plano.model';

export const listMensalidades = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, clienteId } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (clienteId) query.clienteId = clienteId;

    const mensalidades = await Mensalidade.find(query)
      .populate('clienteId', 'nome documento whatsapp')
      .sort({ dataVencimento: 1 });

    res.status(200).json(mensalidades);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar mensalidades.', details: error.message });
  }
};

export const baixarMensalidadeManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mensalidade = await Mensalidade.findById(id);
    if (!mensalidade) {
      res.status(404).json({ error: 'Mensalidade não encontrada.' });
      return;
    }

    if (mensalidade.status === 'PAGO') {
      res.status(400).json({ error: 'Esta mensalidade já foi paga anteriormente.' });
      return;
    }

    mensalidade.status = 'PAGO';
    mensalidade.dataPagamento = new Date();
    await mensalidade.save();

    res.status(200).json({ message: 'Baixa manual registrada com sucesso.', mensalidade });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao dar baixa manual na mensalidade.', details: error.message });
  }
};

/**
 * Rotina de Faturamento Automático (Geração de Mensalidades)
 * Pode ser disparada via Cron Job diariamente
 */
export const rodarFaturamentoAutomatico = async (req: Request, res: Response): Promise<void> => {
  try {
    const hoje = new Date();
    
    // Buscar todos os clientes ativos com os planos populados
    const clientesAtivos = await Cliente.find({ ativo: true }).populate('planoId');
    let faturasGeradasCount = 0;

    for (const cliente of clientesAtivos) {
      // Obter o dia de vencimento configurado no cliente (padrão 10)
      const diaVencimento = cliente.diaVencimento || 10; 
      
      // Calcular a data de vencimento deste ciclo (mês atual ou próximo)
      const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
      if (dataVencimento < hoje) {
        // Se já passou o dia deste mês, o vencimento será no próximo mês
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      // Calcular a data de emissão ideal (10 dias antes do vencimento)
      const dataEmissaoIdeal = new Date(dataVencimento);
      dataEmissaoIdeal.setDate(dataEmissaoIdeal.getDate() - 10);

      const inicioDiaVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate());
      const fimDiaVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate(), 23, 59, 59, 999);

      // Verificar ciclo de periodicidade baseado na última mensalidade gerada
      const ultimaMensalidade = await Mensalidade.findOne({ clienteId: cliente._id }).sort({ dataVencimento: -1 });
      if (ultimaMensalidade && cliente.planoId) {
        const plano = cliente.planoId as any;
        let mesesExigidos = 1;
        if (plano.periodicidade === 'BIMESTRAL') mesesExigidos = 2;
        else if (plano.periodicidade === 'TRIMESTRAL') mesesExigidos = 3;
        else if (plano.periodicidade === 'SEMESTRAL') mesesExigidos = 6;
        else if (plano.periodicidade === 'ANUAL') mesesExigidos = 12;

        const diferencaMeses = (inicioDiaVencimento.getFullYear() - ultimaMensalidade.dataVencimento.getFullYear()) * 12 + 
                               (inicioDiaVencimento.getMonth() - ultimaMensalidade.dataVencimento.getMonth());
        
        if (diferencaMeses < mesesExigidos) {
          // Já faturado no ciclo ativo. Pula este cliente.
          continue;
        }
      }

      // Se a data de emissão ideal já passou ou é hoje, e ainda não há fatura gerada para este vencimento
      const faturaExistente = await Mensalidade.findOne({
        clienteId: cliente._id,
        dataVencimento: { $gte: inicioDiaVencimento, $lte: fimDiaVencimento }
      });

      if (!faturaExistente) {
        // Contar quantos veículos o cliente possui ativos no momento
        const veiculos = await Veiculo.find({ clienteId: cliente._id }).select('_id');
        const veiculoIds = veiculos.map(v => v._id);
        const veiculosCount = await HistoricoInstalacao.countDocuments({
          veiculoId: { $in: veiculoIds },
          dataDesinstalacao: { $exists: false }
        });

        if (veiculosCount > 0) {
          let valorMensalidade = veiculosCount * 80.00; // Tarifa base default
          const plano = cliente.planoId as any;

          if (plano) {
            let valorOriginal = 0;
            if (plano.tipoCobranca === 'POR_VEICULO') {
              valorOriginal = veiculosCount * plano.valorBase;
            } else if (plano.tipoCobranca === 'FIXO_GLOBAL') {
              valorOriginal = plano.valorBase;
            } else if (plano.tipoCobranca === 'ESCALONADO_FROTA') {
              const faixas = plano.faixasPreco || [];
              const faixa = faixas.find((f: any) => veiculosCount >= f.de && (!f.ate || veiculosCount <= f.ate));
              const valorUnitario = faixa ? faixa.valor : 80.00;
              valorOriginal = veiculosCount * valorUnitario;
            }

            // Aplicar desconto de fidelidade se houver
            if (plano.descontoFidelidadePct > 0) {
              const desconto = valorOriginal * (plano.descontoFidelidadePct / 100);
              valorOriginal = valorOriginal - desconto;
            }
            
            valorMensalidade = valorOriginal;
          }

          const novaMensalidade = new Mensalidade({
            clienteId: cliente._id,
            dataVencimento: inicioDiaVencimento,
            dataEmissao: hoje,
            valor: valorMensalidade,
            status: 'PENDENTE'
          });

          await novaMensalidade.save();
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
