import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Usuario } from './usuario.model';

export const injectAdminEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminHash = await bcrypt.hash('123456', 10);
    const admin = await Usuario.create({
      nome: 'Administrador Supremo',
      email: 'admin@aprastro.com',
      senhaHash: adminHash,
      role: 'admin',
      ativo: true
    });
    res.json({ success: true, message: 'Admin injetado com sucesso.', email: admin.email, senha: '123456' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
