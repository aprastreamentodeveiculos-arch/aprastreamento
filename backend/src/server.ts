import dotenv from 'dotenv';
import { startBillingCron } from './modules/financeiro/billing.service';
import app from './app';
import { connectDatabase } from './config/db';
import { OrdemServico } from './modules/ordens/ordem.model';
import { runSeeding } from './modules/seed/seed.routes';

// Carregar variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDatabase();

    // Executar auto-seed se o banco de dados local em memória/standalone estiver vazio
    try {
      const count = await OrdemServico.countDocuments();
      if (count === 0) {
        console.log('🔄 Banco de dados vazio detectado. Executando auto-seed de teste...');
        await runSeeding();
        console.log('✅ Auto-seed concluído com sucesso!');
      }
    } catch (seedErr: any) {
      console.error('⚠️ Falha ao executar auto-seed:', seedErr.message);
    }

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
