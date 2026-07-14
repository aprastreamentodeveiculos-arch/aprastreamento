import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cliente } from '../clientes/cliente.model';
import { Fatura } from './fatura.model';
import { Assinatura } from './assinatura.model';
import { Plano } from '../planos/plano.model';

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
const MensalidadeLegada = mongoose.models.Mensalidade || mongoose.model('Mensalidade', MensalidadeLegadaSchema, 'mensalidades');

export const runMigrationEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientes = await Cliente.find();
    let assinaturasCriadas = 0;
    let faturasMigradas = 0;

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

      const mensalidades = await MensalidadeLegada.find({ clienteId: cliente._id });
      
      for (const mens of mensalidades) {
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

    res.json({ success: true, assinaturasCriadas, faturasMigradas });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runCleanupEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await mongoose.connection.db!.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('mensalidades')) {
      await mongoose.connection.db!.dropCollection('mensalidades');
      res.json({ success: true, message: 'Coleção mensalidades deletada' });
    } else {
      res.json({ success: true, message: 'Coleção não existe' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
