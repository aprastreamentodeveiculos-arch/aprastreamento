import { Request, Response } from 'express';
import { Ticket } from './ticket.model';

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

    // Simulação robusta do disparo de e-mail no console
    console.log('\n====================================================================');
    console.log('📧 SIMULAÇÃO DE DISPARO DE E-MAIL DE SUPORTE');
    console.log(`Destinatário: ${destinatario}`);
    console.log(`Assunto: [AP RASTRO] Novo Chamado Registrado - ${ticketId}`);
    console.log('--------------------------------------------------------------------');
    console.log(`Olá, Equipe Técnica da AP RASTRO,\n`);
    console.log(`Um novo chamado de suporte foi aberto e exige atenção:\n`);
    console.log(`• ID do Chamado:  ${ticketId}`);
    console.log(`• Solicitante:   ${usuarioNome} (${usuarioRole === 'admin' ? 'Administrador' : 'Técnico Instalador'})`);
    console.log(`• Tela/Origem:   ${pagina}`);
    console.log(`• Categoria:     ${tipoErro}`);
    console.log(`• Descrição:\n  "${descricao}"\n`);
    console.log(`• Data de Abertura: ${new Date().toLocaleString('pt-BR')}`);
    console.log('--------------------------------------------------------------------');
    console.log('✅ Notificação de e-mail processada e enviada com sucesso (Simulado).');
    console.log('====================================================================\n');

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
