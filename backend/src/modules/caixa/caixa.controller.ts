import { Request, Response } from 'express';
import { Despesa } from './despesa.model';
import { CategoriaDespesa } from './categoriaDespesa.model';

export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome } = req.body;
    if (!nome) {
      res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
      return;
    }

    const existente = await CategoriaDespesa.findOne({ nome: nome.trim() });
    if (existente) {
      res.status(400).json({ error: 'Esta categoria já está cadastrada.' });
      return;
    }

    const novaCategoria = new CategoriaDespesa({ nome: nome.trim() });
    await novaCategoria.save();

    res.status(201).json(novaCategoria);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar categoria.', details: error.message });
  }
};

export const listCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await CategoriaDespesa.find().sort({ nome: 1 });
    res.status(200).json(categorias);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar categorias.', details: error.message });
  }
};

export const createDespesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { descricao, valor, data, categoriaId } = req.body;

    if (!descricao || !valor || !categoriaId) {
      res.status(400).json({ error: 'Dados obrigatórios ausentes (descricao, valor, categoriaId).' });
      return;
    }

    const novaDespesa = new Despesa({
      descricao,
      valor,
      data: data ? new Date(data) : new Date(),
      categoriaId
    });

    await novaDespesa.save();

    res.status(201).json(novaDespesa);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao lançar despesa.', details: error.message });
  }
};

export const listDespesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { busca, categoriaId, mes } = req.query;
    const query: any = {};

    if (categoriaId) {
      query.categoriaId = categoriaId;
    }

    if (busca) {
      query.descricao = { $regex: busca, $options: 'i' };
    }

    if (mes) {
      // mes vem no formato "AAAA-MM"
      const [ano, mesStr] = (mes as string).split('-');
      const dataInicio = new Date(parseInt(ano), parseInt(mesStr) - 1, 1);
      const dataFim = new Date(parseInt(ano), parseInt(mesStr), 0, 23, 59, 59, 999);
      query.data = { $gte: dataInicio, $lte: dataFim };
    }

    const despesas = await Despesa.find(query)
      .populate('categoriaId', 'nome')
      .sort({ data: -1 });

    // Calcular o total acumulado das despesas filtradas
    const totalAcumulado = despesas.reduce((sum, d) => sum + d.valor, 0);

    res.status(200).json({
      total: totalAcumulado,
      count: despesas.length,
      despesas
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar despesas.', details: error.message });
  }
};
