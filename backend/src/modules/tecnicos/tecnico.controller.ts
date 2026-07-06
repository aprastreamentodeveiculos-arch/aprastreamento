import { Request, Response } from 'express';
import { Tecnico } from './tecnico.model';
import { Usuario } from '../usuarios/usuario.model';
import bcrypt from 'bcryptjs';

export const createTecnico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, telefone, email, endereco, senha } = req.body;

    if (!nome || !email) {
      res.status(400).json({ error: 'Nome e Email do técnico são obrigatórios.' });
      return;
    }

    // Check if user already exists
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
      return;
    }

    const novoTecnico = new Tecnico({
      nome,
      telefone,
      email,
      endereco
    });

    await novoTecnico.save();

    // Create synchronized User
    const senhaHash = await bcrypt.hash(senha || '123456', 10);
    const novoUsuario = new Usuario({
      nome,
      email,
      senhaHash,
      role: 'tecnico',
      ativo: true,
      tecnicoId: novoTecnico._id
    });

    await novoUsuario.save();

    res.status(201).json(novoTecnico);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar técnico.', details: error.message });
  }
};

export const listTecnicos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ativo } = req.query;
    const query: any = {};

    if (ativo !== undefined) {
      query.ativo = ativo === 'true';
    }

    const tecnicos = await Tecnico.find(query).sort({ nome: 1 });
    res.status(200).json(tecnicos);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar técnicos.', details: error.message });
  }
};

export const updateTecnico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nome, telefone, email, endereco, senha, ativo } = req.body;

    const tecnico = await Tecnico.findByIdAndUpdate(id, { nome, telefone, email, endereco, ativo }, { new: true });
    
    if (!tecnico) {
      res.status(404).json({ error: 'Técnico não encontrado.' });
      return;
    }

    // Sync with User
    const updateData: any = { nome, email, ativo };
    if (senha) {
      updateData.senhaHash = await bcrypt.hash(senha, 10);
    }

    await Usuario.findOneAndUpdate({ tecnicoId: id }, updateData);

    res.status(200).json(tecnico);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar técnico.', details: error.message });
  }
};

export const deleteTecnico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tecnico = await Tecnico.findByIdAndDelete(id);

    if (!tecnico) {
      res.status(404).json({ error: 'Técnico não encontrado.' });
      return;
    }

    // Also delete the linked User account
    await Usuario.findOneAndDelete({ tecnicoId: id });

    res.status(200).json({ message: 'Técnico e usuário de acesso excluídos com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir técnico.', details: error.message });
  }
};
