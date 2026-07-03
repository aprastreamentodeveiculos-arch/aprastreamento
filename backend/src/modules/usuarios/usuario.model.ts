import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUsuario extends Document {
  nome: string;
  email: string;
  senhaHash: string;
  role: 'admin' | 'tecnico';
  ativo: boolean;
  tecnicoId?: mongoose.Types.ObjectId; // Referência opcional para um técnico se role = tecnico
  compareSenha(senha: string): Promise<boolean>;
}

const UsuarioSchema: Schema = new Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    senhaHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'tecnico'], default: 'tecnico' },
    ativo: { type: Boolean, default: true },
    tecnicoId: { type: Schema.Types.ObjectId, ref: 'Tecnico', required: false }
  },
  { timestamps: true }
);

// Método para comparar senha no login
UsuarioSchema.methods.compareSenha = async function (senha: string): Promise<boolean> {
  return bcrypt.compare(senha, this.senhaHash);
};

export const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);
