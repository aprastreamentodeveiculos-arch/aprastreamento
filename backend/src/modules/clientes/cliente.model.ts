import { Schema, model, Document } from 'mongoose';

export interface IEndereco {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface ICliente extends Document {
  nome: string;
  documento: string; // CPF ou CNPJ
  email?: string;
  whatsapp?: string;
  endereco?: IEndereco;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EnderecoSchema = new Schema<IEndereco>({
  rua: { type: String, trim: true },
  numero: { type: String, trim: true },
  bairro: { type: String, trim: true },
  cidade: { type: String, trim: true },
  uf: { type: String, trim: true },
  cep: { type: String, trim: true }
}, { _id: false });

const ClienteSchema = new Schema<ICliente>({
  nome: { type: String, required: true, trim: true },
  documento: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  whatsapp: { type: String, trim: true },
  endereco: { type: EnderecoSchema, default: {} },
  ativo: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Cliente = model<ICliente>('Cliente', ClienteSchema);
