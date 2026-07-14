import dotenv from 'dotenv';
import { startBillingCron } from './modules/financeiro/billing.service';
import app from './app';
import { connectDatabase } from './config/db';
import { OrdemServico } from './modules/ordens/ordem.model';
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDatabase();

    // O auto-seed foi removido a pedido do admin

    // Iniciar o servidor Express
    startBillingCron();

app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();
