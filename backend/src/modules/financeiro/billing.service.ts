import cron from 'node-cron';
import { Cliente } from '../clientes/cliente.model';
import { Plano } from '../planos/plano.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { Mensalidade } from './mensalidade.model';

export const startBillingCron = () => {
  // Rodar todos os dias às 02:00 da manhã
  cron.schedule('0 2 * * *', async () => {
    console.log('[Billing Cron] Iniciando processamento de mensalidades...');
    try {
      await processPendingInvoices();
      await generateNewInvoices();
      console.log('[Billing Cron] Processamento concluído com sucesso.');
    } catch (error) {
      console.error('[Billing Cron] Erro durante o processamento:', error);
    }
  });
};

const processPendingInvoices = async () => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar todas as mensalidades PENDENTES cuja dataVencimento já passou
  const vencidas = await Mensalidade.find({
    status: 'PENDENTE',
    dataVencimento: { $lt: hoje }
  });

  if (vencidas.length > 0) {
    console.log(`[Billing Cron] Encontradas ${vencidas.length} mensalidades vencidas. Atualizando status para ATRASADO.`);
    for (const fatura of vencidas) {
      fatura.status = 'ATRASADO';
      await fatura.save();
    }
  }
};

const generateNewInvoices = async () => {
  const hoje = new Date();
  
  // Para geração de faturas: vamos gerar 7 dias antes do vencimento
  // Vamos descobrir qual será o "dia de vencimento" que precisa ser faturado hoje
  const dataAlvoVencimento = new Date();
  dataAlvoVencimento.setDate(hoje.getDate() + 7);
  
  const diaVencimentoAlvo = dataAlvoVencimento.getDate();

  // Buscar todos os clientes ativos que possuem plano
  const clientes = await Cliente.find({
    ativo: true,
    planoId: { $ne: null },
    diaVencimento: diaVencimentoAlvo
  }).populate('planoId');

  for (const cliente of clientes) {
    // Verificar se já gerou fatura para este cliente no mês/ano do vencimento
    const mesVencimento = dataAlvoVencimento.getMonth();
    const anoVencimento = dataAlvoVencimento.getFullYear();

    const dataInicioBusca = new Date(anoVencimento, mesVencimento, 1);
    const dataFimBusca = new Date(anoVencimento, mesVencimento + 1, 0, 23, 59, 59);

    const faturaExistente = await Mensalidade.findOne({
      clienteId: cliente._id,
      dataVencimento: { $gte: dataInicioBusca, $lte: dataFimBusca }
    });

    if (faturaExistente) {
      continue; // Fatura já foi gerada
    }

    const plano: any = cliente.planoId;
    if (!plano || !plano.ativo) continue;

    // Calcular o valor da fatura
    let valorTotal = 0;
    const veiculosCount = await Veiculo.countDocuments({ clienteId: cliente._id, ativo: true });

    if (plano.tipoCobranca === 'FIXO_GLOBAL') {
      valorTotal = plano.valorBase;
    } else if (plano.tipoCobranca === 'POR_VEICULO') {
      valorTotal = plano.valorBase * veiculosCount;
    } else if (plano.tipoCobranca === 'ESCALONADO_FROTA') {
      for (const faixa of plano.faixasPreco) {
        if (veiculosCount >= faixa.de && (!faixa.ate || veiculosCount <= faixa.ate)) {
          valorTotal = faixa.valor * veiculosCount;
          break;
        }
      }
    }

    // Se o valor for 0, não gera fatura (talvez o cliente não tenha veículos ativos)
    if (valorTotal > 0) {
      const novaFatura = new Mensalidade({
        clienteId: cliente._id,
        dataVencimento: new Date(anoVencimento, mesVencimento, diaVencimentoAlvo),
        dataEmissao: hoje,
        valor: valorTotal,
        status: 'PENDENTE'
      });
      await novaFatura.save();
      console.log(`[Billing Cron] Fatura gerada para o cliente ${cliente.nome} no valor de R$ ${valorTotal.toFixed(2)}`);
    }
  }
};
