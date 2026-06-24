import { Schema, model, Document, Types } from 'mongoose';

export type StatusMensalidade = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export interface IMensalidade extends Document {
  clienteId: Types.ObjectId;
  dataVencimento: Date;
  dataEmissao: Date;
  dataPagamento?: Date;
  valor: number;
  status: StatusMensalidade;
  createdAt: Date;
  updatedAt: Date;
}

const MensalidadeSchema = new Schema<IMensalidade>({
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  dataVencimento: { type: Date, required: true },
  dataEmissao: { type: Date, required: true, default: Date.now },
  dataPagamento: { type: Date },
  valor: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDENTE', 'PAGO', 'ATRASADO'],
    default: 'PENDENTE'
  }
}, {
  timestamps: true
});

export const Mensalidade = model<IMensalidade>('Mensalidade', MensalidadeSchema);
