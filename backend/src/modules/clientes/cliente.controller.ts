import { Request, Response } from 'express';
import { Assinatura } from '../financeiro/assinatura.model';
import { Cliente } from './cliente.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { HistoricoInstalacao } from '../historico/historico.model';
import { Fatura } from '../financeiro/fatura.model';
import { Plano } from '../planos/plano.model';
import { Equipamento } from '../equipamentos/equipamento.model';

export const createCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, documento, email, whatsapp, endereco, planoId, diaVencimento, indicacao, veiculos } = req.body;

    if (!nome || !documento) {
      res.status(400).json({ error: 'Nome e Documento (CPF/CNPJ) são obrigatórios.' });
      return;
    }

    // Verificar se já existe cliente com o mesmo documento
    const clienteExistente = await Cliente.findOne({ documento });
    if (clienteExistente) {
      res.status(400).json({ error: 'Já existe um cliente cadastrado com este CPF/CNPJ.' });
      return;
    }

    const novoCliente = new Cliente({
      nome,
      documento,
      email,
      whatsapp,
      endereco: endereco || {},
      planoId: planoId || null,
      diaVencimento: diaVencimento !== undefined ? Number(diaVencimento) : 10,
      indicacao: indicacao || ''
    });

    await novoCliente.save();

    // Se vierem veículos na requisição, cadastrá-los e vincular rastreadores
    if (veiculos && Array.isArray(veiculos) && veiculos.length > 0) {
      for (const vData of veiculos) {
        if (!vData.placa) continue;

        const novoVeiculo = new Veiculo({
          clienteId: novoCliente._id,
          placa: vData.placa,
          marca: vData.marca,
          modelo: vData.modelo,
          ano: vData.ano,
          cor: vData.cor
        });
        await novoVeiculo.save();

        if (vData.rastreadorId) {
          // Marcar rastreador como instalado
          const eq = await Equipamento.findByIdAndUpdate(vData.rastreadorId, { status: 'INSTALADO' });
          if (eq && eq.tecnicoResponsavelId) {
            // Gerar histórico
            await HistoricoInstalacao.create({
              veiculoId: novoVeiculo._id,
              rastreadorId: eq._id,
              tecnicoId: eq.tecnicoResponsavelId,
              dataInstalacao: new Date()
            });
          }
        }
      }
    }

    res.status(201).json(novoCliente);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar cliente.', details: error.message });
  }
};

export const listClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { busca, ativo } = req.query;
    const query: any = {};

    // Filtro de ativos/inativos
    if (ativo === 'false') {
      query.ativo = false;
    } else if (ativo !== 'todos') {
      query.ativo = true; // Por padrão, busca apenas os ativos
    }

    // Busca textual simplificada por nome ou documento
    if (busca) {
      query.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { documento: { $regex: busca, $options: 'i' } }
      ];
    }

    const clientes = await Cliente.find(query).populate('planoId').sort({ nome: 1 }).lean();
    
    // Contabilizar veículos ativos por cliente de forma assíncrona paralela
    const clientesComCount = await Promise.all(
      clientes.map(async (c: any) => {
        const veiculos = await Veiculo.find({ clienteId: c._id }).select('_id');
        const veiculoIds = veiculos.map(v => v._id);
        const veiculosCount = await HistoricoInstalacao.countDocuments({
          veiculoId: { $in: veiculoIds },
          dataDesinstalacao: { $exists: false }
        });
        return {
          ...c,
          veiculosCount
        };
      })
    );

    res.status(200).json(clientesComCount);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar clientes.', details: error.message });
  }
};

export const getClienteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id).lean();

    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const veiculos = await Veiculo.find({ clienteId: cliente._id }).select('_id');
    const veiculoIds = veiculos.map(v => v._id);
    const veiculosCount = await HistoricoInstalacao.countDocuments({
      veiculoId: { $in: veiculoIds },
      dataDesinstalacao: { $exists: false }
    });

    const clienteComCount = {
      ...cliente,
      veiculosCount
    };

    res.status(200).json(clienteComCount);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar cliente.', details: error.message });
  }
};

export const updateCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nome, documento, email, whatsapp, endereco, ativo, indicacao } = req.body;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    // Se estiver alterando o documento, verificar unicidade
    if (documento && documento !== cliente.documento) {
      const clienteExistente = await Cliente.findOne({ documento });
      if (clienteExistente) {
        res.status(400).json({ error: 'Já existe outro cliente cadastrado com este CPF/CNPJ.' });
        return;
      }
      cliente.documento = documento;
    }

    if (nome) cliente.nome = nome;
    if (email !== undefined) cliente.email = email;
    if (whatsapp !== undefined) cliente.whatsapp = whatsapp;
    if (endereco) cliente.endereco = { ...cliente.endereco, ...endereco };
    if (ativo !== undefined) cliente.ativo = ativo;
    if (indicacao !== undefined) cliente.indicacao = indicacao;

    await cliente.save();

    res.status(200).json(cliente);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar cliente.', details: error.message });
  }
};

export const deleteCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivoInativacao, detalhesInativacao, operadorCancelamento } = req.body;
    
    // Em sistemas ERP, geralmente desativamos o cadastro em vez de apagar do banco físico.
    const cliente = await Cliente.findByIdAndUpdate(
      id,
      { 
        ativo: false,
        motivoInativacao: motivoInativacao || 'Não informado',
        detalhesInativacao: detalhesInativacao || '',
        operadorCancelamento: operadorCancelamento || 'Sistema',
        dataInativacao: new Date()
      },
      { returnDocument: 'after' }
    );

    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    // Cancelar as faturas pendentes deste cliente para que não fiquem ativas no faturamento
    await Fatura.updateMany(
      { clienteId: id, status: 'PENDENTE' },
      { $set: { status: 'CANCELADO', observacao: 'Cliente inativado.' } }
    );

    res.status(200).json({ message: 'Cliente desativado com sucesso. Faturas pendentes foram canceladas.', cliente });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao desativar cliente.', details: error.message });
  }
};

export const getClientePanorama = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findById(id).populate('planoId').lean();
    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const veiculos = await Veiculo.find({ clienteId: id });
    const faturas = await Fatura.find({ clienteId: id }).sort({ dataVencimento: -1 });
    const assinatura = await Assinatura.findOne({ clienteId: id });

    // Pega historico de todos os veiculos desse cliente
    const veiculoIds = veiculos.map((v) => v._id);
    const historico = await HistoricoInstalacao.find({ veiculoId: { $in: veiculoIds } }).sort({ dataInstalacao: -1 }).populate('tecnicoId', 'nome');

    res.status(200).json({
      assinatura,
      cliente,
      veiculos,
      faturas,
      historico
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao consolidar panorama do cliente.', details: error.message });
  }
};
