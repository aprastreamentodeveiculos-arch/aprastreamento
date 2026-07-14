import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAjusteFinanceiro extends Document {
  faturaId: Types.ObjectId;
  clienteId: Types.ObjectId;
  tipo: 'CREDITO' | 'DEBITO' | 'DESCONTO_MANUAL' | 'MULTA' | 'JUROS';
  valor: number;
  motivo: string;
  operador: string; // Quem autorizou/lançou o ajuste
  dataAjuste: Date;
}

const AjusteFinanceiroSchema: Schema = new Schema({
  faturaId: { type: Schema.Types.ObjectId, ref: 'Fatura', required: true, index: true },
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true, index: true },
  tipo: { 
    type: String, 
    enum: ['CREDITO', 'DEBITO', 'DESCONTO_MANUAL', 'MULTA', 'JUROS'], 
    required: true 
  },
  valor: { type: Number, required: true },
  motivo: { type: String, required: true },
  operador: { type: String, required: true },
  dataAjuste: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const AjusteFinanceiro = mongoose.model<IAjusteFinanceiro>('AjusteFinanceiro', AjusteFinanceiroSchema);
