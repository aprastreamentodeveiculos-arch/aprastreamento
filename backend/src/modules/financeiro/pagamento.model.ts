import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPagamento extends Document {
  faturaId: Types.ObjectId;
  clienteId: Types.ObjectId; // Denormalizado para agilidade nas consultas
  valor: number;
  metodoPagamento: 'PIX' | 'BOLETO' | 'CARTAO_CREDITO' | 'DINHEIRO' | 'TRANSFERENCIA';
  status: 'CONCLUIDO' | 'FALHO' | 'PENDENTE';
  protocolo: string;
  operador: string; // Quem registrou a baixa
  dataPagamento: Date;
}

const PagamentoSchema: Schema = new Schema({
  faturaId: { type: Schema.Types.ObjectId, ref: 'Fatura', required: true, index: true },
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true, index: true },
  valor: { type: Number, required: true },
  metodoPagamento: { 
    type: String, 
    enum: ['PIX', 'BOLETO', 'CARTAO_CREDITO', 'DINHEIRO', 'TRANSFERENCIA'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['CONCLUIDO', 'FALHO', 'PENDENTE'], 
    default: 'CONCLUIDO' 
  },
  protocolo: { type: String, required: true, unique: true },
  operador: { type: String, required: true },
  dataPagamento: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const Pagamento = mongoose.model<IPagamento>('Pagamento', PagamentoSchema);
