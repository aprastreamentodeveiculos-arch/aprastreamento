import { Schema, model, Document, Types } from 'mongoose';

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
  indicacao?: string;
  motivoInativacao?: string;
  detalhesInativacao?: string;
  dataInativacao?: Date;
  operadorCancelamento?: string;
  planoId?: Types.ObjectId | null;
  diaVencimento: number;
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
  nome: { type: String, required: true, trim: true, index: true },
  documento: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  whatsapp: { type: String, trim: true },
  endereco: { type: EnderecoSchema, default: {} },
  ativo: { type: Boolean, default: true, index: true },
  indicacao: { type: String, trim: true },
  motivoInativacao: { type: String, trim: true },
  detalhesInativacao: { type: String, trim: true },
  dataInativacao: { type: Date },
  operadorCancelamento: { type: String, trim: true },
  planoId: { type: Schema.Types.ObjectId, ref: 'Plano', default: null },
  diaVencimento: { type: Number, default: 10, enum: [5, 10, 15, 20, 25] }
}, {
  timestamps: true
});

export const Cliente = model<ICliente>('Cliente', ClienteSchema);
