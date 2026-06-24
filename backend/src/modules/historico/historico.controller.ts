import { Request, Response } from 'express';
import { HistoricoInstalacao } from './historico.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { Equipamento } from '../equipamentos/equipamento.model';

export const getHistoricoPorVeiculo = async (req: Request, res: Response): Promise<void> => {
  try {
    const placa = req.params.placa as string;

    if (!placa) {
      res.status(400).json({ error: 'A placa do veículo é obrigatória.' });
      return;
    }

    const veiculo = await Veiculo.findOne({ placa: placa.toUpperCase() });
    if (!veiculo) {
      res.status(404).json({ error: 'Veículo não encontrado.' });
      return;
    }

    const historico = await HistoricoInstalacao.find({ veiculoId: veiculo._id })
      .populate('tecnicoId', 'nome telefone')
      .populate('rastreadorId', 'identificador marca modelo')
      .populate('chipId', 'identificador operadora numeroLinha')
      .sort({ dataInstalacao: -1 });

    res.status(200).json({
      veiculo,
      historico
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar histórico do veículo.', details: error.message });
  }
};

export const getHistoricoPorRastreador = async (req: Request, res: Response): Promise<void> => {
  try {
    const imei = req.params.imei as string;

    if (!imei) {
      res.status(400).json({ error: 'O IMEI do rastreador é obrigatório.' });
      return;
    }

    const rastreador = await Equipamento.findOne({ identificador: imei, tipo: 'RASTREADOR' });
    if (!rastreador) {
      res.status(404).json({ error: 'Rastreador não encontrado no estoque.' });
      return;
    }

    const historico = await HistoricoInstalacao.find({ rastreadorId: rastreador._id })
      .populate('tecnicoId', 'nome telefone')
      .populate('veiculoId', 'placa marca modelo')
      .populate('chipId', 'identificador operadora')
      .sort({ dataInstalacao: -1 });

    res.status(200).json({
      rastreador,
      historico
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar histórico do rastreador.', details: error.message });
  }
};
