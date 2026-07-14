import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssinatura extends Document {
  clienteId: Types.ObjectId;
  planoId: Types.ObjectId;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  diaVencimento: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

const AssinaturaSchema: Schema = new Schema({
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true, index: true },
  planoId: { type: Schema.Types.ObjectId, ref: 'Plano', required: true },
  status: { 
    type: String, 
    enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED'], 
    default: 'ACTIVE',
    index: true 
  },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  diaVencimento: { type: Number, required: true, default: 10 }
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' }
});

// Chave Shard potencial composta { clienteId: 1, status: 1 }
AssinaturaSchema.index({ clienteId: 1, status: 1 });

export const Assinatura = mongoose.model<IAssinatura>('Assinatura', AssinaturaSchema);
