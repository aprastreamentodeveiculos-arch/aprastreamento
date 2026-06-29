import { Schema, model, Document, Types } from 'mongoose';

export type StatusOrdemServico = 'AGENDADA' | 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export interface IOrdemServico extends Document {
  tecnicoId: Types.ObjectId;
  veiculoId: Types.ObjectId;
  rastreadorId: Types.ObjectId;
  status: StatusOrdemServico;
  observacoes?: string;
  fotosUrls: string[];
  motivoRejeicao?: string;
  dataResolucao?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrdemServicoSchema = new Schema<IOrdemServico>({
  tecnicoId: { type: Schema.Types.ObjectId, ref: 'Tecnico', required: true },
  veiculoId: { type: Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  rastreadorId: { type: Schema.Types.ObjectId, ref: 'Equipamento', required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['AGENDADA', 'PENDENTE', 'APROVADO', 'REJEITADO'],
    default: 'PENDENTE'
  },
  observacoes: { type: String, trim: true },
  fotosUrls: [{ type: String }],
  motivoRejeicao: { type: String, trim: true },
  dataResolucao: { type: Date }
}, {
  timestamps: true
});

export const OrdemServico = model<IOrdemServico>('OrdemServico', OrdemServicoSchema);
