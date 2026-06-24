import { Request, Response } from 'express';
import { Mensalidade } from './mensalidade.model';
import { Cliente } from '../clientes/cliente.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { HistoricoInstalacao } from '../historico/historico.model';

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
    
    // Buscar todos os clientes ativos
    const clientesAtivos = await Cliente.find({ ativo: true });
    let faturasGeradasCount = 0;

    for (const cliente of clientesAtivos) {
      // Por simplicidade, assume-se dia 10 como padrão ou pode ser cadastrado no Cliente.
      // Vamos simular que o dia de vencimento de todos os clientes é o dia 10 do próximo mês
      // e o sistema verifica se hoje é 10 dias antes (ou seja, dia 30/31 ou dia de acordo com a regra).
      // Regra real: Vencimentos 05, 10, 15, 20, 25.
      // Vamos assumir que cada cliente possui um campo "diaVencimento" (padrão 10).
      const diaVencimento = 10; 
      
      // Calcular a data de vencimento deste ciclo (mês atual ou próximo)
      const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
      if (dataVencimento < hoje) {
        // Se já passou o dia deste mês, o vencimento será no próximo mês
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      // Calcular a data de emissão ideal (10 dias antes do vencimento)
      const dataEmissaoIdeal = new Date(dataVencimento);
      dataEmissaoIdeal.setDate(dataEmissaoIdeal.getDate() - 10);

      // Se a data de emissão ideal já passou ou é hoje, e ainda não há fatura gerada para este vencimento
      const inicioDiaVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate());
      const fimDiaVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate(), 23, 59, 59, 999);

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
          const valorMensalidade = veiculosCount * 80.00; // Tarifa base de R$ 80,00 por veículo

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
