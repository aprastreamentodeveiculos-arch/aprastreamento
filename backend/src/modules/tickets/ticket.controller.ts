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

    // Envio real de e-mail via Nodemailer
    const subject = `[AP RASTRO] Novo Chamado Registrado - ${ticketId}`;
    const text = `
Olá, Equipe Técnica da AP RASTRO,

Um novo chamado de suporte foi aberto e exige atenção:

• ID do Chamado:  ${ticketId}
• Solicitante:   ${usuarioNome} (${usuarioRole === 'admin' ? 'Administrador' : 'Técnico Instalador'})
• Tela/Origem:   ${pagina}
• Categoria:     ${tipoErro}
• Descrição:
  "${descricao}"

• Data de Abertura: ${new Date().toLocaleString('pt-BR')}

Por favor, acesse o painel para maiores detalhes.
    `;

    await sendEmail(destinatario, subject, text);

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
