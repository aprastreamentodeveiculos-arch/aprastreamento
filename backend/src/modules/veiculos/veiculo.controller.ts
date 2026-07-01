import { Request, Response } from 'express';
import { Veiculo } from './veiculo.model';
import { Equipamento } from '../equipamentos/equipamento.model';
import { HistoricoInstalacao } from '../historico/historico.model';
import { Tecnico } from '../tecnicos/tecnico.model';
import { Cliente } from '../clientes/cliente.model';

export const bulkCreate = async (req: Request, res: Response) => {
  try {
    const { clienteId, veiculos } = req.body;

    if (!clienteId || !Array.isArray(veiculos) || veiculos.length === 0) {
      return res.status(400).json({ message: 'Cliente ID e lista de veículos são obrigatórios' });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Busca ou cria o Técnico "SISTEMA MIGRAÇÃO"
    let tecnicoSistema = await Tecnico.findOne({ nome: 'SISTEMA MIGRAÇÃO' });
    if (!tecnicoSistema) {
      tecnicoSistema = await Tecnico.create({
        nome: 'SISTEMA MIGRAÇÃO',
        ativo: true
      });
    }

    const createdVeiculos = [];

    for (const vData of veiculos) {
      const { placa, marca, modelo, cor, ano, imei } = vData;

      if (!placa) continue; // Placa é obrigatória

      // 1. Cria o Veículo
      const novoVeiculo = await Veiculo.create({
        clienteId,
        placa,
        marca,
        modelo,
        cor,
        ano,
        status: 'ATIVO'
      });

      createdVeiculos.push(novoVeiculo);

      // 2. Trata o Rastreador (Equipamento) se um IMEI for fornecido
      if (imei) {
        let equipamento = await Equipamento.findOne({ identificador: imei });
        if (!equipamento) {
          // Cria o equipamento automaticamente se não existir
          equipamento = await Equipamento.create({
            identificador: imei,
            status: 'INSTALADO'
          });
        } else {
          // Se já existir, apenas atualiza o status para INSTALADO
          equipamento.status = 'INSTALADO';
          await equipamento.save();
        }

        // 3. Gera o Histórico de Instalação para amarrar o Rastreador ao Veículo e torná-lo ativo no dashboard
        await HistoricoInstalacao.create({
          veiculoId: novoVeiculo._id,
          rastreadorId: equipamento._id,
          tecnicoId: tecnicoSistema._id,
          dataInstalacao: new Date(),
          observacao: 'Cadastro em Massa (Migração/Frota)'
        });
      }
    }

    res.status(201).json({ 
      message: 'Frota cadastrada com sucesso', 
      veiculosCadastrados: createdVeiculos.length,
      veiculos: createdVeiculos
    });

  } catch (error: any) {
    console.error('Erro no bulkCreate de veículos:', error);
    res.status(500).json({ message: 'Erro ao cadastrar frota em massa', error: error.message });
  }
};
