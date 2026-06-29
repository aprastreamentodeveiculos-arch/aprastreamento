import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do transporter do Nodemailer usando variáveis de ambiente
const transporter = nodemailer.createTransport({
  service: 'gmail', // Pode ser alterado conforme o provedor do cliente
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Recomenda-se usar "Senha de Aplicativo" do Gmail
  },
});

/**
 * Função utilitária para enviar e-mails
 * @param to E-mail do destinatário
 * @param subject Assunto do e-mail
 * @param text Conteúdo em texto plano
 * @param html (Opcional) Conteúdo em HTML
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const mailOptions = {
      from: `"AP Rastro Suporte" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado com sucesso para ${to}. ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar e-mail para ${to}:`, error);
    return false;
  }
};
