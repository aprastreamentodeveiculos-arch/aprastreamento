import { Router, Request, Response } from 'express';
import { Cliente } from '../clientes/cliente.model';
import { Tecnico } from '../tecnicos/tecnico.model';
import { Veiculo } from '../veiculos/veiculo.model';
import { Equipamento } from '../equipamentos/equipamento.model';
import { OrdemServico } from '../ordens/ordem.model';
import { HistoricoInstalacao } from '../historico/historico.model';
import { Mensalidade } from '../financeiro/mensalidade.model';
import { Despesa } from '../caixa/despesa.model';
import { CategoriaDespesa } from '../caixa/categoriaDespesa.model';

const router = Router();

export const runSeeding = async () => {
  // 1. Limpar coleções antigas
  await Cliente.deleteMany({});
  await Tecnico.deleteMany({});
  await Veiculo.deleteMany({});
  await Equipamento.deleteMany({});
  await OrdemServico.deleteMany({});
  await HistoricoInstalacao.deleteMany({});
  await Mensalidade.deleteMany({});
  await Despesa.deleteMany({});
  await CategoriaDespesa.deleteMany({});

  console.log('🧹 Banco de dados limpo para seeding.');

  // 2. Criar Técnicos
  const tecnico1 = await Tecnico.create({
    nome: 'Roberto Alves da Silva',
    telefone: '(11) 96543-2100',
    email: 'roberto.tecnico@aprastro.com',
    endereco: 'Rua das Flores, 123, São Paulo - SP',
    ativo: true
  });

  const tecnico2 = await Tecnico.create({
    nome: 'Felipe Santana Lima',
    telefone: '(19) 94321-0987',
    email: 'felipe.tecnico@aprastro.com',
    endereco: 'Av. Brasil, 456, Campinas - SP',
    ativo: true
  });

  // 3. Criar Clientes
  const cliente1 = await Cliente.create({
    nome: 'Transportadora TransFast',
    documento: '12.345.678/0001-90',
    email: 'contato@transfast.com',
    whatsapp: '(11) 98765-4321',
    endereco: { rua: 'Marginal Pinheiros', numero: '2000', cidade: 'São Paulo', estado: 'SP', cep: '04578-000' },
    ativo: true
  });

  const cliente2 = await Cliente.create({
    nome: 'Ana Júlia Medeiros',
    documento: '456.789.123-00',
    email: 'anajulia@gmail.com',
    whatsapp: '(21) 99888-7766',
    endereco: { rua: 'Av. Copacabana', numero: '789', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '22020-002' },
    ativo: true
  });

  const cliente3 = await Cliente.create({
    nome: 'Cooperativa TaxiRio',
    documento: '98.765.432/0001-10',
    email: 'financeiro@taxirio.com',
    whatsapp: '(21) 97777-6655',
    endereco: { rua: 'Rua do Ouvidor', numero: '50', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20040-030' },
    ativo: true
  });

  // 4. Criar Veículos
  const veiculo1 = await Veiculo.create({
    clienteId: cliente1._id,
    placa: 'ABC1D23',
    marca: 'Volkswagen',
    modelo: 'Gol',
    cor: 'Branco',
    ano: '2021'
  });

  const veiculo2 = await Veiculo.create({
    clienteId: cliente2._id,
    placa: 'XYZ9H87',
    marca: 'Chevrolet',
    modelo: 'Onix',
    cor: 'Preto',
    ano: '2022'
  });

  // 5. Criar Equipamentos (Rastreadores e Chips)
  const rastreador1 = await Equipamento.create({
    tipo: 'RASTREADOR',
    identificador: '358293029384729',
    status: 'INSTALADO',
    tecnicoResponsavelId: tecnico1._id,
    marca: 'Suntech',
    modelo: 'ST310U'
  });

  const chip1 = await Equipamento.create({
    tipo: 'CHIP',
    identificador: '8955102003948576201',
    status: 'INSTALADO',
    tecnicoResponsavelId: tecnico1._id,
    operadora: 'Vivo',
    numeroLinha: '(11) 91234-5678',
    apn: 'smart.m2m.vivo.com.br'
  });

  const rastreador2 = await Equipamento.create({
    tipo: 'RASTREADOR',
    identificador: '358293029384812',
    status: 'INSTALADO',
    tecnicoResponsavelId: tecnico1._id,
    marca: 'Coban',
    modelo: 'TK303G'
  });

  const chip2 = await Equipamento.create({
    tipo: 'CHIP',
    identificador: '8955102003948576409',
    status: 'INSTALADO',
    tecnicoResponsavelId: tecnico1._id,
    operadora: 'Claro',
    numeroLinha: '(11) 98765-4321',
    apn: 'claro.m2m'
  });

  // Equipamentos em estoque
  const rastreadorEstoque = await Equipamento.create({
    tipo: 'RASTREADOR',
    identificador: '358293029384501',
    status: 'ESTOQUE',
    marca: 'Suntech',
    modelo: 'ST310U'
  });

  const chipEstoque = await Equipamento.create({
    tipo: 'CHIP',
    identificador: '8955102003948576999',
    status: 'ESTOQUE',
    operadora: 'Vivo',
    numeroLinha: '(11) 90000-1111',
    apn: 'smart.m2m.vivo.com.br'
  });

  // Equipamentos com Técnico Felipe Santana (pronto para instalar)
  const rastreadorComTecnico = await Equipamento.create({
    tipo: 'RASTREADOR',
    identificador: '358293029384931',
    status: 'COM_TECNICO',
    tecnicoResponsavelId: tecnico2._id,
    marca: 'Suntech',
    modelo: 'ST300H'
  });

  const chipComTecnico = await Equipamento.create({
    tipo: 'CHIP',
    identificador: '8955102003948576302',
    status: 'COM_TECNICO',
    tecnicoResponsavelId: tecnico2._id,
    operadora: 'Vivo',
    numeroLinha: '(11) 92222-3333',
    apn: 'smart.m2m.vivo.com.br'
  });

  // 6. Criar Histórico de Instalações para os ativos
  await HistoricoInstalacao.create({
    veiculoId: veiculo1._id,
    rastreadorId: rastreador1._id,
    chipId: chip1._id,
    tecnicoId: tecnico1._id,
    dataInstalacao: new Date('2026-05-10T14:30:00Z')
  });

  await HistoricoInstalacao.create({
    veiculoId: veiculo2._id,
    rastreadorId: rastreador2._id,
    chipId: chip2._id,
    tecnicoId: tecnico1._id,
    dataInstalacao: new Date('2026-06-12T09:15:00Z')
  });

  // 7. Criar Mensalidades
  // Fatura para cliente 1 (TransFast) - Vencimento dia 10 do próximo mês
  await Mensalidade.create({
    clienteId: cliente1._id,
    valor: 80.00,
    dataEmissao: new Date('2026-06-15T00:00:00Z'),
    dataVencimento: new Date('2026-06-25T00:00:00Z'),
    status: 'PENDENTE'
  });

  // Fatura para cliente 2 (Ana Júlia) - Vencimento dia 10 do próximo mês
  await Mensalidade.create({
    clienteId: cliente2._id,
    valor: 80.00,
    dataEmissao: new Date('2026-06-15T00:00:00Z'),
    dataVencimento: new Date('2026-06-25T00:00:00Z'),
    status: 'PENDENTE'
  });

  // 8. Criar Categorias de Despesas
  const catChips = await CategoriaDespesa.create({ nome: 'Chips M2M' });
  const catComb = await CategoriaDespesa.create({ nome: 'Combustível' });
  const catAlug = await CategoriaDespesa.create({ nome: 'Aluguel' });
  const catMark = await CategoriaDespesa.create({ nome: 'Marketing' });

  // 9. Criar Despesas
  await Despesa.create({
    descricao: 'Compra de 20 chips M2M Vivo',
    valor: 250.00,
    data: new Date('2026-06-05T00:00:00Z'),
    categoriaId: catChips._id
  });

  await Despesa.create({
    descricao: 'Combustível fiorino visita técnica',
    valor: 120.00,
    data: new Date('2026-06-18T00:00:00Z'),
    categoriaId: catComb._id
  });

  await Despesa.create({
    descricao: 'Aluguel escritório Junho',
    valor: 1200.00,
    data: new Date('2026-06-01T00:00:00Z'),
    categoriaId: catAlug._id
  });

  // 10. Criar uma OS pendente
  // Veículo temporário para a OS pendente (Cooperativa TaxiRio)
  const veiculoOS = await Veiculo.create({
    clienteId: cliente3._id,
    placa: 'KRT5H21',
    marca: 'Fiat',
    modelo: 'Cronos',
    cor: 'Preto',
    ano: '2023'
  });

  await OrdemServico.create({
    tecnicoId: tecnico2._id,
    veiculoId: veiculoOS._id,
    rastreadorId: rastreadorComTecnico._id,
    chipId: chipComTecnico._id,
    observacoes: 'Instalação feita no painel de fusíveis atrás do volante.',
    status: 'PENDENTE',
    fotosUrls: ['uploads/mock_chicote.jpg', 'uploads/mock_fusivel.jpg']
  });

  // Criar equipamentos adicionais para OS agendada
  const rastreadorAgendado = await Equipamento.create({
    tipo: 'RASTREADOR',
    identificador: '358293029384662',
    status: 'COM_TECNICO',
    tecnicoResponsavelId: tecnico2._id,
    marca: 'Suntech',
    modelo: 'ST310U'
  });

  const chipAgendado = await Equipamento.create({
    type: 'CHIP', // Correção sutil no modelo se o banco exigir
    tipo: 'CHIP',
    identificador: '8955102003948576551',
    status: 'COM_TECNICO',
    tecnicoResponsavelId: tecnico2._id,
    operadora: 'Claro',
    numeroLinha: '(11) 94444-5555',
    apn: 'claro.m2m'
  } as any);

  // Veículo para OS agendada
  const veiculoOSAgendada = await Veiculo.create({
    clienteId: cliente3._id,
    placa: 'OSD9H99',
    marca: 'Nissan',
    modelo: 'Kicks',
    cor: 'Preto',
    ano: '2024'
  });

  // 11. Criar uma OS agendada
  await OrdemServico.create({
    tecnicoId: tecnico2._id,
    veiculoId: veiculoOSAgendada._id,
    rastreadorId: rastreadorAgendado._id,
    chipId: chipAgendado._id,
    status: 'AGENDADA',
    fotosUrls: []
  });

  return {
    tecnicos: 2,
    clientes: 3,
    veiculos: 4,
    equipamentos: 10,
    historicos: 2,
    mensalidades: 2,
    categorias: 4,
    despesas: 3,
    ordensPendentes: 1,
    ordensAgendadas: 1
  };
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const dados = await runSeeding();
    res.status(200).json({
      message: 'Base de dados populada com sucesso para testes da AP RASTRO!',
      dados
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao popular banco de dados.', details: error.message });
  }
});

export default router;
