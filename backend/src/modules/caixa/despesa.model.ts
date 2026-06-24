import { Schema, model, Document, Types } from 'mongoose';

export interface IDespesa extends Document {
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DespesaSchema = new Schema<IDespesa>({
  descricao: { type: String, required: true, trim: true },
  valor: { type: Number, required: true, min: 0 },
  data: { type: Date, required: true, default: Date.now },
  categoriaId: { type: Schema.Types.ObjectId, ref: 'CategoriaDespesa', required: true }
}, {
  timestamps: true
});

export const Despesa = model<IDespesa>('Despesa', DespesaSchema);
