import { Schema, model, Document, Types } from 'mongoose';

export type StatusMensalidade = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'PARCIAL';

export interface IMensalidade extends Document {
  clienteId: Types.ObjectId;
  dataVencimento: Date;
  dataEmissao: Date;
  dataPagamento?: Date;
  valor: number;
  desconto?: number;
  acrescimo?: number;
  valorPago?: number;
  protocolo?: string;
  formaPagamento?: string;
  detalhes?: string;
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
  desconto: { type: Number, default: 0 },
  acrescimo: { type: Number, default: 0 },
  valorPago: { type: Number, default: 0 },
  protocolo: { type: String, trim: true },
  formaPagamento: { type: String, trim: true },
  detalhes: { type: String, trim: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDENTE', 'PAGO', 'ATRASADO', 'PARCIAL'],
    default: 'PENDENTE'
  }
}, {
  timestamps: true
});

export const Mensalidade = model<IMensalidade>('Mensalidade', MensalidadeSchema);
