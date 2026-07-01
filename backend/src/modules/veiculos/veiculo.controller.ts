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

    // Validação prévia de IMEIs informados
    const imeisInformados = veiculos.map((v: any) => v.imei).filter((imei: string) => imei && imei.trim() !== '');
    if (imeisInformados.length > 0) {
      const equipamentosExistentes = await Equipamento.find({ identificador: { $in: imeisInformados } });
      const imeisExistentes = equipamentosExistentes.map(e => e.identificador);
      
      const imeisNaoEncontrados = imeisInformados.filter((imei: string) => !imeisExistentes.includes(imei));
      
      if (imeisNaoEncontrados.length > 0) {
        return res.status(400).json({ 
          message: 'Os seguintes rastreadores (IMEI) não existem no estoque. Cadastre-os primeiro!', 
          imeisInvalidos: imeisNaoEncontrados 
        });
      }
    }

    // Busca ou cria o Técnico "SISTEMA MIGRAÇÃO"
    let tecnicoSistema = await Tecnico.findOne({ nome: 'SISTEMA MIGRAÇÃO' });
    if (!tecnicoSistema) {
      tecnicoSistema = await Tecnico.create({
        nome: 'SISTEMA MIGRAÇÃO',
        ativo: true
      });
    }

    const createdVeiculos: any[] = [];

    for (const vData of veiculos) {
      const { placa, marca, modelo, cor, ano, imei, iccid } = vData;

      if (!placa) continue; // Placa é obrigatória

      // 1. Cria o Veículo
      const novoVeiculo = await Veiculo.create({
        clienteId,
        placa,
        marca,
        modelo,
        cor,
        ano
      });

      createdVeiculos.push(novoVeiculo);

      // 2. Trata o Rastreador (Equipamento) se um IMEI for fornecido
      if (imei) {
        let equipamento = await Equipamento.findOne({ identificador: imei });
        if (equipamento) {
          // Atualiza o status para INSTALADO
          equipamento.status = 'INSTALADO';
          if (iccid && iccid.trim() !== '') {
            equipamento.iccid = iccid;
          }
          await equipamento.save();

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
