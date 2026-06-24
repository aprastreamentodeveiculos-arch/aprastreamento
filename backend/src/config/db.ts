import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ap_rastro';
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB conectado com sucesso.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão do MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Conexão com MongoDB perdida.');
    });

    console.log('🔄 Tentando conectar ao MongoDB Atlas do cliente...');
    // Definir limite de tempo de 5 segundos para a seleção do servidor
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
  } catch (error: any) {
    console.error('❌ Falha ao conectar ao MongoDB Atlas:', error.message);
    console.log('⚠️ Iniciando fallback para MongoDB em Memória (Local)...');
    
    try {
      // Importação dinâmica para evitar erros de compilação/produção se o pacote não existir
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      
      console.log(`ℹ️ MongoDB em Memória criado com sucesso na URI: ${memoryUri}`);
      process.env.IS_LOCAL_DB = 'true';
      await mongoose.connect(memoryUri);
    } catch (memError: any) {
      console.error('❌ Falha crítica: Não foi possível iniciar o MongoDB em Memória:', memError.message);
      console.log('ℹ️ Dica: Certifique-se de que "mongodb-memory-server" está instalado nas devDependencies do backend.');
    }
  }
};
