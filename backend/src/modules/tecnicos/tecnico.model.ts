import { Schema, model, Document } from 'mongoose';

export interface ITecnico extends Document {
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TecnicoSchema = new Schema<ITecnico>({
  nome: { type: String, required: true, trim: true },
  telefone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  endereco: { type: String, trim: true },
  ativo: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Tecnico = model<ITecnico>('Tecnico', TecnicoSchema);
