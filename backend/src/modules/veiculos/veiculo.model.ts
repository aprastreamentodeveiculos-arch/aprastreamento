import { Schema, model, Document, Types } from 'mongoose';

export interface IVeiculo extends Document {
  clienteId: Types.ObjectId;
  placa: string;
  marca?: string;
  modelo?: string;
  cor?: string;
  ano?: string;
  chassi?: string;
  renavam?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VeiculoSchema = new Schema<IVeiculo>({
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true, index: true },
  ativo: { type: Boolean, default: true, index: true },
  placa: { 
    type: String,  
    required: true, 
    unique: true, 
    trim: true, 
    uppercase: true,
    // Validador simples de placa Mercosul / Antiga
    validate: {
      validator: (v: string) => {
        // Aceita formatos como ABC1234 ou ABC1D23 (Mercosul)
        return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(v.replace(/[^A-Z0-9]/gi, ''));
      },
      message: (props: any) => `${props.value} não é um formato de placa válido.`
    }
  },
  marca: { type: String, trim: true },
  modelo: { type: String, trim: true },
  cor: { type: String, trim: true },
  ano: { type: String, trim: true },
  chassi: { type: String, trim: true },
  renavam: { type: String, trim: true }
}, {
  timestamps: true
});

export const Veiculo = model<IVeiculo>('Veiculo', VeiculoSchema);
