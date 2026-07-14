import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFatura extends Document {
  assinaturaId: Types.ObjectId;
  clienteId: Types.ObjectId; // Denormalizado para performance nas consultas de dashboard
  status: 'PENDENTE' | 'PAGO' | 'PARCIAL' | 'CANCELADA';
  dataEmissao: Date;
  dataVencimento: Date;
  dataPagamento?: Date; // Data da quitação total
  valorTotal: number;
  valorPago: number;
  linhas: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    subtotal: number;
  }>;
  criadoEm: Date;
  atualizadoEm: Date;
}

const FaturaSchema: Schema = new Schema({
  assinaturaId: { type: Schema.Types.ObjectId, ref: 'Assinatura', required: true, index: true },
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true, index: true },
  status: { 
    type: String, 
    enum: ['PENDENTE', 'PAGO', 'PARCIAL', 'CANCELADA'], 
    default: 'PENDENTE',
    index: true 
  },
  dataEmissao: { type: Date, required: true },
  dataVencimento: { type: Date, required: true, index: true },
  dataPagamento: { type: Date },
  valorTotal: { type: Number, required: true },
  valorPago: { type: Number, default: 0 },
  linhas: [{
    descricao: { type: String, required: true },
    quantidade: { type: Number, required: true },
    valorUnitario: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }]
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' }
});

// Chave Shard potencial baseada no cliente
FaturaSchema.index({ clienteId: 1, dataVencimento: -1 });

export const Fatura = mongoose.model<IFatura>('Fatura', FaturaSchema);
