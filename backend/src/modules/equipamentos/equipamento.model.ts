import { Schema, model, Document, Types } from 'mongoose';

export type StatusEquipamento = 'ESTOQUE' | 'COM_TECNICO' | 'INSTALADO' | 'DEFEITUOSO' | 'DEV_FORNECEDOR';

export interface IEquipamento extends Document {
  identificador: string; // IMEI do Rastreador
  iccid?: string;        // Número de série do chip embutido
  numeroLinha?: string;  
  operadora?: string;    
  apn?: string;          
  marca?: string;        
  modelo?: string;       
  status: StatusEquipamento;
  tecnicoResponsavelId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EquipamentoSchema = new Schema<IEquipamento>({
  identificador: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  iccid: { type: String, trim: true },
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
