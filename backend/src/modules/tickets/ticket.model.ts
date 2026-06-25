import { Schema, model, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  usuarioNome: string;
  usuarioRole: string;
  pagina: string;
  tipoErro: string;
  descricao: string;
  destinatarioEmail: string;
  status: 'ABERTO' | 'RESOLVIDO';
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true },
  usuarioNome: { type: String, required: true, trim: true },
  usuarioRole: { type: String, required: true, trim: true },
  pagina: { type: String, required: true, trim: true },
  tipoErro: { type: String, required: true, trim: true },
  descricao: { type: String, required: true, trim: true },
  destinatarioEmail: { type: String, required: true, default: 'ANDREWLAMEIRA30@GMAIL.COM' },
  status: { type: String, enum: ['ABERTO', 'RESOLVIDO'], default: 'ABERTO' }
}, {
  timestamps: true
});

export const Ticket = model<ITicket>('Ticket', TicketSchema);
