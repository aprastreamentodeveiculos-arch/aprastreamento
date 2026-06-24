import { Schema, model, Document, Types } from 'mongoose';

export type TipoEquipamento = 'RASTREADOR' | 'CHIP';
export type StatusEquipamento = 'ESTOQUE' | 'COM_TECNICO' | 'INSTALADO' | 'DEFEITUOSO' | 'DEV_FORNECEDOR';

export interface IEquipamento extends Document {
  tipo: TipoEquipamento;
  identificador: string; // IMEI (Rastreador) ou ICCID (Chip)
  numeroLinha?: string;  // Apenas para CHIP
  operadora?: string;    // Apenas para CHIP (Vivo, Claro, Tim, etc.)
  apn?: string;          // Apenas para CHIP
  marca?: string;        // Apenas para RASTREADOR (Suntech, Queclink, etc.)
  modelo?: string;       // Apenas para RASTREADOR
  status: StatusEquipamento;
  tecnicoResponsavelId?: Types.ObjectId; // Técnico associado se estiver COM_TECNICO
  createdAt: Date;
  updatedAt: Date;
}

const EquipamentoSchema = new Schema<IEquipamento>({
  tipo: { 
    type: String, 
    required: true, 
    enum: ['RASTREADOR', 'CHIP'] 
  },
  identificador: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  numeroLinha: { type: String, trim: true },
  operadora: { type: String, trim: true },
  apn: { type: String, trim: true },
  marca: { type: String, trim: true },
  modelo: { type: String, trim: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['ESTOQUE', 'COM_TECNICO', 'INSTALADO', 'DEFEITUOSO', 'DEV_FORNECEDOR'],
    default: 'ESTOQUE'
  },
  tecnicoResponsavelId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tecnico', 
    default: null 
  }
}, {
  timestamps: true
});

export const Equipamento = model<IEquipamento>('Equipamento', EquipamentoSchema);
