import { Request, Response } from 'express';
import { Ticket } from './ticket.model';
import { sendEmail } from '../../utils/mailer';

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuarioNome, usuarioRole, pagina, tipoErro, descricao, destinatarioEmail } = req.body;

    if (!usuarioNome || !usuarioRole || !pagina || !tipoErro || !descricao) {
      res.status(400).json({ error: 'Dados obrigatórios ausentes para criar o chamado.' });
      return;
    }

    // Gerar ticketId sequencial amigável
    const count = await Ticket.countDocuments();
    const ticketId = `#TK-${1001 + count}`;

    const destinatario = destinatarioEmail || 'ANDREWLAMEIRA30@GMAIL.COM';

    const novoTicket = new Ticket({
      ticketId,
      usuarioNome,
      usuarioRole,
      pagina,
      tipoErro,
      descricao,
      destinatarioEmail: destinatario,
      status: 'ABERTO'
    });

    await novoTicket.save();

    // O e-mail automático via API foi desativado. 
    // O envio de e-mail agora é acionado pelo frontend (via mailto:).

    res.status(201).json(novoTicket);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao registrar chamado de suporte.', details: error.message });
  }
};

export const listTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar chamados de suporte.', details: error.message });
  }
};
