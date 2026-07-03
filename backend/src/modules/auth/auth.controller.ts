import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../usuarios/usuario.model';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-super-secreta-aprastro';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ message: 'Usuário inativo. Contate o administrador.' });
    }

    const isMatch = await usuario.compareSenha(senha);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { _id: usuario._id, role: usuario.role, tecnicoId: usuario.tecnicoId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tecnicoId: usuario.tecnicoId
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
};
