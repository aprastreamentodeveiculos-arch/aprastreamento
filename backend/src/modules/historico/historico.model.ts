import { Schema, model, Document, Types } from 'mongoose';

export interface IHistoricoInstalacao extends Document {
  veiculoId: Types.ObjectId;
  rastreadorId: Types.ObjectId;
  chipId: Types.ObjectId;
  tecnicoId: Types.ObjectId;
  dataInstalacao: Date;
  dataDesinstalacao?: Date;
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HistoricoInstalacaoSchema = new Schema<IHistoricoInstalacao>({
  veiculoId: { type: Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  rastreadorId: { type: Schema.Types.ObjectId, ref: 'Equipamento', required: true },
  chipId: { type: Schema.Types.ObjectId, ref: 'Equipamento', required: true },
  tecnicoId: { type: Schema.Types.ObjectId, ref: 'Tecnico', required: true },
  dataInstalacao: { type: Date, required: true, default: Date.now },
  dataDesinstalacao: { type: Date },
  observacao: { type: String, trim: true }
}, {
  timestamps: true
});

export const HistoricoInstalacao = model<IHistoricoInstalacao>('HistoricoInstalacao', HistoricoInstalacaoSchema);
