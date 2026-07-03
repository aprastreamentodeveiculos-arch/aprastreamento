import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Usuario } from './src/modules/usuarios/usuario.model';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to DB');

    // Remove existing admin if any
    await Usuario.deleteMany({ email: 'admin@aprastro.com' });

    const adminHash = await bcrypt.hash('123456', 10);
    await Usuario.create({
      nome: 'Administrador Supremo',
      email: 'admin@aprastro.com',
      senhaHash: adminHash,
      role: 'admin',
      ativo: true
    });
    console.log('Admin user injected successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
