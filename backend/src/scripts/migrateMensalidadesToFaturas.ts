import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Importa os modelos
import { Cliente } from '../modules/clientes/cliente.model';
import { Fatura } from '../modules/financeiro/fatura.model';
import { Assinatura } from '../modules/financeiro/assinatura.model';
import { Plano } from '../modules/planos/plano.model';
import { AuditoriaLog } from '../modules/historico/auditoria_log.model';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MensalidadeLegadaSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  dataVencimento: Date,
  dataEmissao: Date,
  dataPagamento: Date,
  valor: Number,
  valorPago: Number,
  desconto: Number,
  acrescimo: Number,
  status: String
});

const MensalidadeLegada = mongoose.model('Mensalidade', MensalidadeLegadaSchema, 'mensalidades');

async function runMigration() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI) as string);
    console.log('Conectado. Iniciando migração...');

    const clientes = await Cliente.find();
    console.log(`Encontrados ${clientes.length} clientes para verificar.`);

    let assinaturasCriadas = 0;
    let faturasMigradas = 0;

    // Criar Plano Padrão se não houver
    let planoPadrao = await Plano.findOne({ nome: 'Plano Legado Migração' });
    if (!planoPadrao) {
      planoPadrao = await Plano.create({
        nome: 'Plano Legado Migração',
        tipoCobranca: 'POR_VEICULO',
        periodicidade: 'MENSAL',
        valorBase: 80,
        ativo: true
      });
    }

    for (const cliente of clientes) {
      // 1. Cria assinatura para o cliente se ele for ativo (ou mesmo inativo para guardar histórico)
      let assinatura = await Assinatura.findOne({ clienteId: cliente._id });
      if (!assinatura) {
        assinatura = await Assinatura.create({
          clienteId: cliente._id,
          planoId: planoPadrao._id,
          status: cliente.ativo ? 'ACTIVE' : 'CANCELED',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          diaVencimento: cliente.diaVencimento || 10
        });
        assinaturasCriadas++;
      }

      // 2. Busca mensalidades legadas deste cliente
      const mensalidades = await MensalidadeLegada.find({ clienteId: cliente._id });
      
      for (const mens of mensalidades) {
        // Checa se já migrou (evitar duplicidade)
        const exists = await Fatura.findOne({ clienteId: cliente._id, dataVencimento: mens.dataVencimento });
        if (!exists) {
          const valorTotal = mens.valor || 0;
          
          await Fatura.create({
            assinaturaId: assinatura._id,
            clienteId: cliente._id,
            status: (mens.status === 'ATRASADO' ? 'PENDENTE' : (mens.status || 'PENDENTE')) as any,
            dataEmissao: (mens.dataEmissao || new Date()) as Date,
            dataVencimento: mens.dataVencimento as Date,
            dataPagamento: mens.dataPagamento as Date | undefined,
            valorTotal: valorTotal,
            valorPago: mens.valorPago || 0,
            linhas: [{
              descricao: 'Mensalidade Rastreador (Migração Legada)',
              quantidade: 1,
              valorUnitario: valorTotal,
              subtotal: valorTotal
            }]
          });
          faturasMigradas++;
        }
      }
    }

    console.log(`Migração Finalizada!`);
    console.log(`Assinaturas Criadas: ${assinaturasCriadas}`);
    console.log(`Faturas Migradas: ${faturasMigradas}`);

    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();
