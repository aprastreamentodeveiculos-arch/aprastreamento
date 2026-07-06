import { Schema, model, Document, Types } from 'mongoose';

export interface IDespesa extends Document {
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  editObs?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DespesaSchema = new Schema<IDespesa>({
  descricao: { type: String, required: true, trim: true },
  valor: { type: Number, required: true, min: 0 },
  data: { type: Date, required: true, default: Date.now },
  categoriaId: { type: Schema.Types.ObjectId, ref: 'CategoriaDespesa', required: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  editObs: { type: String, trim: true }
}, {
  timestamps: true
});

// Index to automatically expire soft-deleted documents after 30 days
DespesaSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { isDeleted: true } });

export const Despesa = model<IDespesa>('Despesa', DespesaSchema);
