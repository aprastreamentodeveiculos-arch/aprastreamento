import dotenv from 'dotenv';

dotenv.config();

// Enviaremos e-mail usando a API nativa da Brevo.com via requisição HTTPS padrão (fetch).
// Não usamos bibliotecas pesadas para garantir o build rápido e sem erros.
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error('❌ Chave BREVO_API_KEY não configurada no servidor.');
      return false;
    }

    const payload = {
      sender: {
        name: 'AP Rastro Suporte',
        email: 'aprastreamento@gmail.com' // Seu email validado na Brevo
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      textContent: text,
      htmlContent: html || text
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(`❌ Erro ao enviar e-mail para ${to} via Brevo:`, err);
      return false;
    }

    const data = await response.json();
    console.log(`✅ E-mail enviado com sucesso para ${to}. ID Brevo: ${data.messageId}`);
    return true;

  } catch (error) {
    console.error(`❌ Erro inesperado ao disparar e-mail para ${to}:`, error);
    return false;
  }
};
