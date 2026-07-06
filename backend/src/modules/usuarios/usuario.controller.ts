import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Usuario } from './usuario.model';
import { Tecnico } from '../tecnicos/tecnico.model';

export const listUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await Usuario.find().select('-senhaHash');
    res.json(usuarios);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao listar usuários', error: error.message });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, role, tecnicoId, telefone } = req.body;

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ message: 'E-mail já está em uso' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    let finalTecnicoId = tecnicoId || undefined;

    // Se for técnico e não passou um ID, criar o técnico automaticamente
    if (role === 'tecnico' && !finalTecnicoId) {
      const novoTec = await Tecnico.create({
        nome,
        telefone: telefone || 'Não Informado',
        email: email.toLowerCase(),
        ativo: true
      });
      finalTecnicoId = novoTec._id;
    }

    const novoUsuario = await Usuario.create({
      nome,
      email: email.toLowerCase(),
      senhaHash,
      role,
      tecnicoId: finalTecnicoId
    });

    res.status(201).json({ 
      _id: novoUsuario._id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      role: novoUsuario.role
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, role, ativo, tecnicoId, senha } = req.body;

    const updates: any = { 
      nome, 
      email: email.toLowerCase(), 
      role, 
      ativo, 
      tecnicoId: tecnicoId || undefined 
    };

    if (senha && senha.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updates.senhaHash = await bcrypt.hash(senha, salt);
    }

    const usuario = await Usuario.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).select('-senhaHash');
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Sincronizar os dados com o Técnico caso seja um usuário do tipo técnico
    if (usuario.tecnicoId) {
      await Tecnico.findByIdAndUpdate(usuario.tecnicoId, {
        nome: usuario.nome,
        ativo: usuario.ativo
      });
    }

    res.json(usuario);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Usuario.findByIdAndDelete(id);
    res.json({ message: 'Usuário removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao excluir usuário', error: error.message });
  }
};
