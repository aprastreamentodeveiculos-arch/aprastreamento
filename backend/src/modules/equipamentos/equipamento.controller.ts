import { Request, Response } from 'express';
import { Equipamento } from './equipamento.model';

export const createEquipamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identificador, iccid, numeroLinha, operadora, apn, marca, modelo } = req.body;

    if (!identificador) {
      res.status(400).json({ error: 'O Identificador (IMEI do rastreador) é obrigatório.' });
      return;
    }

    // Verificar se já existe cadastrado com este identificador
    const existente = await Equipamento.findOne({ identificador });
    if (existente) {
      res.status(400).json({ error: 'Já existe um equipamento cadastrado com este IMEI.' });
      return;
    }

    const novoEquipamento = new Equipamento({
      identificador,
      iccid,
      numeroLinha,
      operadora,
      apn,
      marca,
      modelo,
      status: 'ESTOQUE'
    });

    await novoEquipamento.save();

    res.status(201).json(novoEquipamento);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar equipamento no estoque.', details: error.message });
  }
};

export const listEquipamentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tipo, status, tecnicoId } = req.query;
    const query: any = {};

    if (tipo) query.tipo = tipo;
    if (status) query.status = status;
    if (tecnicoId) query.tecnicoResponsavelId = tecnicoId;

    const equipamentos = await Equipamento.find(query)
      .populate('tecnicoResponsavelId', 'nome')
      .sort({ createdAt: -1 });

    res.status(200).json(equipamentos);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar equipamentos.', details: error.message });
  }
};

export const transferToTecnico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tecnicoId } = req.body; // Se for null, devolve ao estoque central

    const equipamento = await Equipamento.findById(id);
    if (!equipamento) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }

    if (tecnicoId) {
      equipamento.status = 'COM_TECNICO';
      equipamento.tecnicoResponsavelId = tecnicoId;
    } else {
      equipamento.status = 'ESTOQUE';
      equipamento.tecnicoResponsavelId = undefined;
    }

    await equipamento.save();

    res.status(200).json({ message: 'Equipamento transferido com sucesso.', equipamento });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao transferir equipamento.', details: error.message });
  }
};
