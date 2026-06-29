import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// O Resend não usa SMTP puro, logo não sofrerá bloqueio de porta pela Render.
// Ele necessita de uma chave de API válida no .env: RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Função utilitária para enviar e-mails via API do Resend
 * @param to E-mail do destinatário
 * @param subject Assunto do e-mail
 * @param text Conteúdo em texto plano
 * @param html (Opcional) Conteúdo em HTML
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const { data, error } = await resend.emails.send({
      // No plano free do Resend, apenas "onboarding@resend.dev" pode ser usado como remetente
      from: 'AP Rastro Suporte <onboarding@resend.dev>',
      to,
      subject,
      text,
      html: html || text,
    });

    if (error) {
      console.error(`❌ Erro ao enviar e-mail para ${to} via Resend:`, error);
      return false;
    }

    console.log(`✅ E-mail enviado com sucesso para ${to}. ID Resend: ${data?.id}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro inesperado ao disparar e-mail para ${to}:`, error);
    return false;
  }
};
