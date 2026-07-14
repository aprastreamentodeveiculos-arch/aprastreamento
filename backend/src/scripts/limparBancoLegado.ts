import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runCleanup() {
  try {
    console.log('Conectando ao MongoDB para Limpeza de Dados Legados...');
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI) as string);
    console.log('Conectado.');

    const collections = await mongoose.connection.db!.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('mensalidades')) {
      console.log('Coleção legada "mensalidades" encontrada. Iniciando exclusão (drop)...');
      await mongoose.connection.db!.dropCollection('mensalidades');
      console.log('✅ Coleção "mensalidades" excluída com sucesso!');
    } else {
      console.log('⚠️ A coleção "mensalidades" já não existe ou já foi excluída.');
    }

    console.log('Operação de limpeza finalizada com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    process.exit(1);
  }
}

runCleanup();
