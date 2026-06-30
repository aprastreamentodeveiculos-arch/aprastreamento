import { Request, Response } from 'express';
import { OrdemServico } from './ordem.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { Equipamento } from '../equipamentos/equipamento.model';
import { HistoricoInstalacao } from '../historico/historico.model';
import mongoose from 'mongoose';

export const createOrdem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tecnicoId, clienteId, placa, marca, modelo, cor, ano, chassi, renavam, rastreadorId, observacoes } = req.body;

    if (!tecnicoId || !clienteId || !placa || !rastreadorId) {
      res.status(400).json({ error: 'Dados obrigatórios ausentes (tecnicoId, clienteId, placa, rastreadorId).' });
      return;
    }

    // Criar veículo temporário ou verificar se já existe veículo com esta placa
    let veiculo = await Veiculo.findOne({ placa: placa.toUpperCase() });
    
    // Se o veículo já existe, atualizamos seu clienteId para vincular ao novo cliente da ordem
    if (veiculo) {
      if (veiculo.clienteId.toString() !== clienteId.toString()) {
        veiculo.clienteId = clienteId;
        await veiculo.save();
      }
    } else {
      // Se o veículo não existe, criamos ele (com dados opcionais)
      veiculo = new Veiculo({
        clienteId,
        placa: placa.toUpperCase(),
        marca,
        modelo,
        cor,
        ano,
        chassi,
        renavam
      });
      await veiculo.save();
    }

    // Criar a Ordem de Serviço
    const novaOrdem = new OrdemServico({
      tecnicoId,
      veiculoId: veiculo._id,
      rastreadorId,
      observacoes,
      status: req.body.status || 'PENDENTE',
      fotosUrls: req.body.fotosUrls || [] // URLs simbólicos enviados pelo frontend
    });

    await novaOrdem.save();

    // Se o status da O.S. for 'AGENDADA', atualiza o estoque/posse dos equipamentos selecionados
    if (novaOrdem.status === 'AGENDADA') {
      await Equipamento.findByIdAndUpdate(rastreadorId, {
        status: 'COM_TECNICO',
        tecnicoResponsavelId: tecnicoId
      });
    }

    res.status(201).json(novaOrdem);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao abrir ordem de serviço.', details: error.message });
  }
};

export const listOrdens = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tecnicoId } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (tecnicoId) query.tecnicoId = tecnicoId;

    const ordens = await OrdemServico.find(query)
      .populate('tecnicoId', 'nome')
      .populate({
        path: 'veiculoId',
        select: 'placa clienteId',
        populate: {
          path: 'clienteId',
          select: 'nome'
        }
      })
      .populate('rastreadorId', 'identificador')

      .sort({ createdAt: -1 });

    res.status(200).json(ordens);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar ordens de serviço.', details: error.message });
  }
};

export const approveOrdem = async (req: Request, res: Response): Promise<void> => {
  const isLocal = process.env.IS_LOCAL_DB === 'true';
  let session: mongoose.ClientSession | null = null;
  
  if (!isLocal) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessError) {
      session = null;
    }
  }

  try {
    const { id } = req.params;
    const ordem = await OrdemServico.findById(id).session(session ? session : undefined as any);

    if (!ordem) {
      res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return;
    }

    if (ordem.status !== 'PENDENTE') {
      res.status(400).json({ error: 'Esta ordem de serviço já foi resolvida.' });
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return;
    }

    // 1. Alterar status da O.S. para APROVADA
    ordem.status = 'APROVADO';
    ordem.dataResolucao = new Date();
    await ordem.save({ session: session ? session : undefined });

    // 2. Mudar status do Rastreador para INSTALADO
    await Equipamento.findByIdAndUpdate(
      ordem.rastreadorId,
      { status: 'INSTALADO', tecnicoResponsavelId: ordem.tecnicoId },
      { session: session ? session : undefined }
    );



    // 4. Registrar na tabela de histórico de instalação
    const historico = new HistoricoInstalacao({
      veiculoId: ordem.veiculoId,
      rastreadorId: ordem.rastreadorId,
      tecnicoId: ordem.tecnicoId,
      dataInstalacao: new Date()
    });
    await historico.save({ session: session ? session : undefined });

    // Confirmar a transação
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(200).json({ message: 'Ordem de serviço aprovada e equipamentos ativados no veículo.', ordem });
  } catch (error: any) {
    console.error('❌ Erro na aprovação da O.S.:', error);
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).json({ error: 'Erro ao aprovar ordem de serviço.', details: error.message });
  }
};

export const rejectOrdem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivoRejeicao } = req.body;

    if (!motivoRejeicao) {
      res.status(400).json({ error: 'É necessário informar o motivo da rejeição.' });
      return;
    }

    const ordem = await OrdemServico.findById(id);
    if (!ordem) {
      res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      return;
    }

    if (ordem.status !== 'PENDENTE') {
      res.status(400).json({ error: 'Esta ordem de serviço já foi resolvida.' });
      return;
    }

    ordem.status = 'REJEITADO';
    ordem.motivoRejeicao = motivoRejeicao;
    ordem.dataResolucao = new Date();
    await ordem.save();

    res.status(200).json({ message: 'Ordem de serviço rejeitada.', ordem });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao rejeitar ordem de serviço.', details: error.message });
  }
};

export const concluirOrdem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { observacoes, fotosUrls } = req.body;

    const ordem = await OrdemServico.findById(id);
    if (!ordem) {
      res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      return;
    }

    if (ordem.status !== 'AGENDADA' && ordem.status !== 'REJEITADO') {
      res.status(400).json({ error: 'Esta ordem de serviço já foi concluída ou resolvida.' });
      return;
    }

    // Atualizar dados preenchidos pelo técnico
    ordem.status = 'PENDENTE';
    if (observacoes !== undefined) ordem.observacoes = observacoes;
    if (fotosUrls !== undefined) {
      ordem.fotosUrls = fotosUrls;
    }
    
    // Limpar campos de rejeição
    ordem.motivoRejeicao = undefined;
    ordem.dataResolucao = undefined;

    await ordem.save();

    res.status(200).json({ message: 'Instalação concluída e enviada para aprovação do Administrador.', ordem });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao concluir ordem de serviço pelo técnico.', details: error.message });
  }
};
