import { Request, Response } from 'express';
import { Plano } from './plano.model';

export const createPlano = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, tipoCobranca, periodicidade, valorBase, faixasPreco, fidelidadeMeses, descontoFidelidadePct, descricao } = req.body;

    if (!nome || !tipoCobranca) {
      res.status(400).json({ error: 'Os campos nome e tipoCobranca são obrigatórios.' });
      return;
    }

    const planoExistente = await Plano.findOne({ nome });
    if (planoExistente) {
      res.status(400).json({ error: 'Já existe um plano com este nome.' });
      return;
    }

    const novoPlano = new Plano({
      nome,
      tipoCobranca,
      periodicidade: periodicidade || 'MENSAL',
      valorBase: valorBase !== undefined ? Number(valorBase) : 0,
      faixasPreco: faixasPreco || [],
      fidelidadeMeses: fidelidadeMeses !== undefined ? Number(fidelidadeMeses) : 0,
      descontoFidelidadePct: descontoFidelidadePct !== undefined ? Number(descontoFidelidadePct) : 0,
      descricao,
      ativo: true
    });

    await novoPlano.save();
    res.status(201).json(novoPlano);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar plano.', details: error.message });
  }
};

export const listPlanos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apenasAtivos } = req.query;
    const filtro: any = {};

    if (apenasAtivos === 'true') {
      filtro.ativo = true;
    }

    const planos = await Plano.find(filtro).sort({ createdAt: -1 });
    res.status(200).json(planos);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar planos.', details: error.message });
  }
};

export const updatePlano = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;

    const plano = await Plano.findById(id);
    if (!plano) {
      res.status(404).json({ error: 'Plano não encontrado.' });
      return;
    }

    if (nome) {
      const planoComMesmoNome = await Plano.findOne({ nome, _id: { $ne: id } });
      if (planoComMesmoNome) {
        res.status(400).json({ error: 'Já existe outro plano com este nome.' });
        return;
      }
      plano.nome = nome;
    }

    if (descricao !== undefined) plano.descricao = descricao;
    if (ativo !== undefined) plano.ativo = ativo;

    await plano.save();
    res.status(200).json(plano);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar plano.', details: error.message });
  }
};
