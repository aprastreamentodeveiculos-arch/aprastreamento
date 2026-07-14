import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditoriaLog extends Document {
  entidade: 'ASSINATURA' | 'FATURA' | 'PAGAMENTO' | 'CLIENTE' | 'PLANO' | 'AJUSTE';
  entidadeId: Types.ObjectId;
  clienteId?: Types.ObjectId;
  acao: string; // ex: "CANCELAMENTO", "APLICACAO_DESCONTO", "BAIXA_MANUAL"
  descricao: string;
  operador: string; // Nome ou ID de quem realizou a ação
  dadosAnteriores?: any; // Snapshot antes da alteração
  dadosNovos?: any; // Snapshot depois da alteração
  ipOrigem?: string;
  criadoEm: Date;
}

const AuditoriaLogSchema: Schema = new Schema({
  entidade: { type: String, required: true, index: true },
  entidadeId: { type: Schema.Types.ObjectId, required: true, index: true },
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', index: true },
  acao: { type: String, required: true },
  descricao: { type: String, required: true },
  operador: { type: String, required: true },
  dadosAnteriores: { type: Schema.Types.Mixed },
  dadosNovos: { type: Schema.Types.Mixed },
  ipOrigem: { type: String }
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: false } // Apenas createdAt, log não deve ser alterado
});

export const AuditoriaLog = mongoose.model<IAuditoriaLog>('AuditoriaLog', AuditoriaLogSchema);
