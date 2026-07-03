// @ts-nocheck
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importando todos os models
import dns from 'dns';
// Força o Node a usar o DNS do Google para evitar problemas de querySrv (ECONNREFUSED) em alguns provedores/Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { Cliente } from './src/modules/clientes/cliente.model';
import { Veiculo } from './src/modules/veiculos/veiculo.model';
import { Equipamento } from './src/modules/equipamentos/equipamento.model';
import { OrdemServico } from './src/modules/ordens/ordem.model';
import { Tecnico } from './src/modules/tecnicos/tecnico.model';
import { Plano } from './src/modules/planos/plano.model';
import { Mensalidade } from './src/modules/financeiro/mensalidade.model';
import { Ticket } from './src/modules/tickets/ticket.model';
// caixa was giving problems, let's just clear the collections manually without mongoose models if needed,
// but let's try to import them if they exist, or just use mongoose.connection.collections.
import { CategoriaDespesa } from './src/modules/caixa/categoriaDespesa.model';
import { Despesa } from './src/modules/caixa/despesa.model';
import { Historico } from './src/modules/historico/historico.model';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

const runSeed = async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI não encontrado!');
    return;
  }

  try {
    console.log('Conectando ao MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Conectado com sucesso. Iniciando Wipe (Limpeza)...');

    // 1. Limpar todas as coleções usando o db do mongoose para não depender de imports exatos
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].deleteMany({});
    }
    
    console.log('Banco de dados completamente apagado!');

    // 2. Criar Plano Padrão
    const plano = await Plano.create({
      nome: 'Plano Rastreamento Básico',
      tipoCobranca: 'POR_VEICULO',
      periodicidade: 'MENSAL',
      valorBase: 80,
      fidelidadeMeses: 12,
      descontoFidelidadePct: 0,
      ativo: true
    });
    console.log('Plano Padrão criado.');

    // 3. Criar 2 Técnicos
    const tec1 = await Tecnico.create({ nome: 'Carlos Silva', telefone: '11999990001', ativo: true });
    const tec2 = await Tecnico.create({ nome: 'Roberto Alves', telefone: '11999990002', ativo: true });
    console.log('Técnicos criados.');

    // 4. Criar 5 Clientes e 2 Carros cada
    for (let i = 1; i <= 5; i++) {
      const cliente = await Cliente.create({
        nome: `Cliente Teste ${i}`,
        email: `cliente${i}@teste.com`,
        documento: `1112223330${i}`,
        whatsapp: `1198888770${i}`,
        endereco: { rua: 'Rua Teste', numero: '100', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', cep: '01000-000' },
        planoId: plano._id,
        diaVencimento: 10,
        ativo: true
      });

      for (let j = 1; j <= 2; j++) {
        // 5. Criar Equipamento para o Veículo (Instalado)
        const equipamento = await Equipamento.create({
          identificador: `IMEI${i}${j}000000000`,
          iccid: `8955${i}${j}0000000000`,
          numeroLinha: `119777700${i}${j}`,
          operadora: 'Vivo',
          apn: 'zap.vivo.com.br',
          marca: 'Teltonika',
          modelo: 'FMB920',
          status: 'INSTALADO',
          tecnicoResponsavelId: tec1._id
        });

        const veiculo = await Veiculo.create({
          clienteId: cliente._id,
          placa: `ABC1D${i}${j}`,
          marca: 'Toyota',
          modelo: 'Corolla',
          cor: 'Prata',
          ano: '2022'
        });

        // Associar o veículo e equipamento numa OS falsa para que o sistema saiba que estão atrelados
        await OrdemServico.create({
          veiculoId: veiculo._id,
          tecnicoId: tec1._id,
          rastreadorId: equipamento._id,
          status: 'APROVADO',
          observacoes: 'Instalação via Seed',
          fotosUrls: []
        });
      }

      // Atualizar o Veículos Count do cliente (2) - só um campo virtual no front mas vamos garantir
      await Mensalidade.create({
        clienteId: cliente._id,
        dataVencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10), // Próximo mês dia 10
        dataEmissao: new Date(),
        valor: 160, // 2 veículos x 80
        status: 'PENDENTE',
        detalhes: 'Faturamento via Seed'
      });
    }
    console.log('5 Clientes, 10 Veículos e Faturas criados.');

    // 6. Criar mais 10 equipamentos soltos no estoque
    for (let k = 1; k <= 10; k++) {
      await Equipamento.create({
        identificador: `ESTOQ${k}00000000`,
        status: 'ESTOQUE'
      });
    }
    console.log('10 Equipamentos colocados no estoque.');

    console.log('Seed concluído com SUCESSO!');
    process.exit(0);

  } catch (err) {
    console.error('Erro durante o seed:', err);
    process.exit(1);
  }
};

runSeed();
