import { Request, Response } from 'express';
import { Tecnico } from './tecnico.model';

export const createTecnico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, telefone, email, endereco } = req.body;

    if (!nome) {
      res.status(400).json({ error: 'Nome do técnico é obrigatório.' });
      return;
    }

    const novoTecnico = new Tecnico({
      nome,
      telefone,
      email,
      endereco
    });

    await novoTecnico.save();

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
