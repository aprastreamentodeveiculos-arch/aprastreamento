import { Schema, model, Document } from 'mongoose';

export interface ICategoriaDespesa extends Document {
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategoriaDespesaSchema = new Schema<ICategoriaDespesa>({
  nome: { type: String, required: true, unique: true, trim: true }
}, {
  timestamps: true
});

export const CategoriaDespesa = model<ICategoriaDespesa>('CategoriaDespesa', CategoriaDespesaSchema);
