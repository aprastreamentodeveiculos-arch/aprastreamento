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

  console.log('🧹 Banco de dados limpo para seeding de 30 clientes...');

  // 2. Criar Técnicos
  const tecnicosCriados = [];
  const tecnicosDados = [
    { nome: 'Roberto Alves da Silva', telefone: '(11) 96543-2100', email: 'roberto.tecnico@aprastro.com', endereco: 'Rua das Flores, 123, São Paulo - SP', ativo: true },
    { nome: 'Felipe Santana Lima', telefone: '(19) 94321-0987', email: 'felipe.tecnico@aprastro.com', endereco: 'Av. Brasil, 456, Campinas - SP', ativo: true },
    { nome: 'Anderson Cruz Prado', telefone: '(21) 98765-4321', email: 'anderson.tecnico@aprastro.com', endereco: 'Rua do Catete, 98, Rio de Janeiro - RJ', ativo: true }
  ];

  for (const t of tecnicosDados) {
    const tec = await Tecnico.create(t);
    tecnicosCriados.push(tec);
  }

  // 3. Criar Categorias de Despesas
  const catChips = await CategoriaDespesa.create({ nome: 'Chips M2M' });
  const catComb = await CategoriaDespesa.create({ nome: 'Combustível' });
  const catAlug = await CategoriaDespesa.create({ nome: 'Aluguel' });
  const catMark = await CategoriaDespesa.create({ nome: 'Marketing' });
  const catInfra = await CategoriaDespesa.create({ nome: 'Hospedagem & Cloud' });

  // 4. Criar Despesas Coerentes por Mês (Abril, Maio, Junho de 2026)
  const despesasDados = [
    // Abril 2026
    { descricao: 'Aluguel escritório Abril', valor: 1200.00, data: new Date('2026-04-01T10:00:00Z'), categoriaId: catAlug._id },
    { descricao: 'Compra de 20 chips M2M Vivo', valor: 250.00, data: new Date('2026-04-05T14:30:00Z'), categoriaId: catChips._id },
    { descricao: 'Combustível visitas técnicas Abril', valor: 180.00, data: new Date('2026-04-20T17:00:00Z'), categoriaId: catComb._id },
    { descricao: 'Marketing Ads Abril', valor: 300.00, data: new Date('2026-04-10T11:00:00Z'), categoriaId: catMark._id },
    // Maio 2026
    { descricao: 'Aluguel escritório Maio', valor: 1200.00, data: new Date('2026-05-01T10:00:00Z'), categoriaId: catAlug._id },
    { descricao: 'Hospedagem Cloud AWS Maio', valor: 150.00, data: new Date('2026-05-15T09:00:00Z'), categoriaId: catInfra._id },
    { descricao: 'Combustível Fiorino Maio', valor: 220.00, data: new Date('2026-05-22T16:45:00Z'), categoriaId: catComb._id },
    { descricao: 'Material de escritório & panfletos', valor: 180.00, data: new Date('2026-05-18T14:00:00Z'), categoriaId: catMark._id },
    // Junho 2026
    { descricao: 'Aluguel escritório Junho', valor: 1200.00, data: new Date('2026-06-01T10:00:00Z'), categoriaId: catAlug._id },
    { descricao: 'Hospedagem Cloud AWS Junho', valor: 150.00, data: new Date('2026-06-15T09:00:00Z'), categoriaId: catInfra._id },
    { descricao: 'Combustível Fiorino Junho', valor: 280.00, data: new Date('2026-06-12T16:00:00Z'), categoriaId: catComb._id },
    { descricao: 'Compra de 30 chips M2M Claro', valor: 380.00, data: new Date('2026-06-05T11:30:00Z'), categoriaId: catChips._id },
    { descricao: 'Marketing Facebook Ads Junho', valor: 450.00, data: new Date('2026-06-10T15:00:00Z'), categoriaId: catMark._id }
  ];

  for (const d of despesasDados) {
    await Despesa.create(d);
  }

  // 5. 30 Clientes Sortidos
  const templatesClientes = [
    { nome: 'Transportadora LogExpress Ltda', doc: '45.123.789/0001-10', email: 'contato@logexpress.com', zap: '(11) 98765-1100', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Carlos Eduardo de Souza', doc: '123.456.789-10', email: 'carlos.eduardo@gmail.com', zap: '(11) 99123-4567', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Maria Helena Castro', doc: '234.567.890-11', email: 'maria.helena@yahoo.com', zap: '(21) 99234-5678', cidade: 'Rio de Janeiro', estado: 'RJ' },
    { nome: 'Táxi Executivo São Paulo S/A', doc: '34.567.890/0001-22', email: 'financeiro@taxiexecutivosp.com.br', zap: '(11) 98789-0123', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Distribuidora Vale do Rio Doce', doc: '56.789.012/0001-33', email: 'logistica@valedoriodoce.com.br', zap: '(27) 99345-6789', cidade: 'Vitória', estado: 'ES' },
    { nome: 'Marcos Vinicius Pinheiro', doc: '345.678.901-22', email: 'marcos.pinheiro@outlook.com', zap: '(31) 99456-7890', cidade: 'Belo Horizonte', estado: 'MG' },
    { nome: 'Cooperativa de Vans TransLeste', doc: '78.901.234/0001-44', email: 'contato@transleste.coop.br', zap: '(11) 98567-8901', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Amanda Costa Oliveira', doc: '456.789.012-33', email: 'amanda.costa@hotmail.com', zap: '(81) 99567-8901', cidade: 'Recife', estado: 'PE' },
    { nome: 'Locadora RentCar Prime', doc: '90.123.456/0001-55', email: 'reservas@rentcarprime.com.br', zap: '(11) 98123-4567', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Fernando Henrique Silva', doc: '567.890.123-44', email: 'fernando.henrique@gmail.com', zap: '(19) 99678-9012', cidade: 'Campinas', estado: 'SP' },
    { nome: 'Padaria Pão de Ouro Ltda', doc: '12.345.678/0001-66', email: 'contato@paodeouro.com', zap: '(11) 98234-5678', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Camila Bueno dos Santos', doc: '678.901.234-55', email: 'camila.bueno@gmail.com', zap: '(11) 99789-0123', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Construtora Aliança S/A', doc: '23.456.789/0001-77', email: 'compras@construtoraalianca.com.br', zap: '(31) 98345-6789', cidade: 'Belo Horizonte', estado: 'MG' },
    { nome: 'Ricardo Fonseca Almeida', doc: '789.012.345-66', email: 'ricardo.fonseca@yahoo.com.br', zap: '(21) 99890-1234', cidade: 'Rio de Janeiro', estado: 'RJ' },
    { nome: 'Juliana Prado Reis', doc: '890.123.456-77', email: 'juliana.reis@gmail.com', zap: '(11) 99901-2345', cidade: 'Guarulhos', estado: 'SP' },
    { nome: 'VIP Escoltas e Segurança', doc: '34.567.890/0001-88', email: 'operacoes@vipescoltas.com.br', zap: '(11) 98456-7890', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Lucas Gabriel Ferreira', doc: '901.234.567-88', email: 'lucas.gabriel@outlook.com', zap: '(11) 99012-3456', cidade: 'São Bernardo', estado: 'SP' },
    { nome: 'Patricia Souza Lima', doc: '012.345.678-99', email: 'patricia.lima@hotmail.com', zap: '(21) 99123-4567', cidade: 'Niterói', estado: 'RJ' },
    { nome: 'Auto Escola Direção Segura', doc: '45.678.901/0001-99', email: 'contato@direcaosegura.com.br', zap: '(11) 98567-8901', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Bruno Rafael Moreira', doc: '123.234.345-00', email: 'bruno.moreira@gmail.com', zap: '(19) 99234-5678', cidade: 'Piracicaba', estado: 'SP' },
    { nome: 'Cláudia Maria de Assis', doc: '234.345.456-11', email: 'claudia.assis@yahoo.com', zap: '(31) 99345-6789', cidade: 'Uberlândia', estado: 'MG' },
    { nome: 'Supermercado Compre Bem', doc: '56.789.012/0002-11', email: 'comercial@comprebem.com.br', zap: '(11) 98678-9012', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Thiago Cordeiro Ramos', doc: '345.456.567-22', email: 'thiago.ramos@outlook.com', zap: '(21) 99456-7890', cidade: 'Rio de Janeiro', estado: 'RJ' },
    { nome: 'Sofia Martins Peixoto', doc: '456.567.678-33', email: 'sofia.peixoto@gmail.com', zap: '(11) 99567-8901', cidade: 'Osasco', estado: 'SP' },
    { nome: 'Expressinho Moto Frete', doc: '67.890.123/0001-11', email: 'financeiro@expressinhofrete.com.br', zap: '(11) 98789-0123', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Rodrigo Mendes Antunes', doc: '567.678.789-44', email: 'rodrigo.mendes@gmail.com', zap: '(11) 99678-9012', cidade: 'Santo André', estado: 'SP' },
    { nome: 'Beatriz Vasconcelos Cruz', doc: '678.789.890-55', email: 'beatriz.cruz@outlook.com', zap: '(21) 99789-0123', cidade: 'Rio de Janeiro', estado: 'RJ' },
    { nome: 'Logística Integrada TransNorte', doc: '89.012.345/0001-22', email: 'operacoes@transnorte.com.br', zap: '(81) 98890-1234', cidade: 'Jaboatão', estado: 'PE' },
    { nome: 'Guilherme Neves Barbosa', doc: '789.890.901-66', email: 'guilherme.barbosa@yahoo.com.br', zap: '(11) 99890-1234', cidade: 'São Paulo', estado: 'SP' },
    { nome: 'Aline Fernanda Teixeira', doc: '890.901.012-77', email: 'aline.teixeira@gmail.com', zap: '(19) 99901-2345', cidade: 'Sorocaba', estado: 'SP' }
  ];

  const marcasModelos = [
    { marca: 'Volkswagen', modelo: 'Gol' },
    { marca: 'Chevrolet', modelo: 'Onix' },
    { marca: 'Fiat', modelo: 'Uno' },
    { marca: 'Hyundai', modelo: 'HB20' },
    { marca: 'Toyota', modelo: 'Corolla' },
    { marca: 'Ford', modelo: 'Ka' },
    { marca: 'Fiat', modelo: 'Strada' },
    { marca: 'Renault', modelo: 'Kwid' },
    { marca: 'Honda', modelo: 'Civic' },
    { marca: 'Chevrolet', modelo: 'Prisma' }
  ];
  const cores = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho'];

  let countVeiculos = 0;
  let countMensalidades = 0;
  let countEquipamentos = 0;
  let countHistoricos = 0;

  // Gerar dados sequencialmente para cada cliente
  for (let i = 0; i < templatesClientes.length; i++) {
    const temp = templatesClientes[i];
    const cliente = await Cliente.create({
      nome: temp.nome,
      documento: temp.doc,
      email: temp.email,
      whatsapp: temp.zap,
      endereco: { rua: 'Av. Principal', numero: String(100 + i), cidade: temp.cidade, estado: temp.estado, cep: '00000-000' },
      ativo: true
    });

    // PJ costuma ter mais veículos que PF
    const isPJ = temp.nome.includes('Ltda') || temp.nome.includes('S/A') || temp.nome.includes('Supermercado') || temp.nome.includes('Locadora') || temp.nome.includes('Cooperativa');
    const numVeiculos = isPJ ? Math.floor(Math.random() * 3) + 2 : 1; // PJ: 2-4 veículos, PF: 1 veículo

    for (let v = 0; v < numVeiculos; v++) {
      countVeiculos++;
      const mm = marcasModelos[Math.floor(Math.random() * marcasModelos.length)];
      const cor = cores[Math.floor(Math.random() * cores.length)];
      const ano = String(2019 + Math.floor(Math.random() * 6)); // 2019 a 2024
      
      // Gerar placa sortida
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numeros = '0123456789';
      const placa = letras[Math.floor(Math.random()*26)] + letras[Math.floor(Math.random()*26)] + letras[Math.floor(Math.random()*26)] +
                    numeros[Math.floor(Math.random()*10)] + letras[Math.floor(Math.random()*26)] +
                    numeros[Math.floor(Math.random()*10)] + numeros[Math.floor(Math.random()*10)];

      const veiculo = await Veiculo.create({
        clienteId: cliente._id,
        placa,
        marca: mm.marca,
        modelo: mm.modelo,
        cor,
        ano
      });

      // Associar técnico de forma sortida
      const tec = tecnicosCriados[Math.floor(Math.random() * tecnicosCriados.length)];

      // Criar equipamentos instalados
      countEquipamentos += 2;
      const idRastreador = '35829302' + String(1000000 + countVeiculos);
      const idChip = '895510200' + String(1000000000 + countVeiculos);

      const rastreador = await Equipamento.create({
        tipo: 'RASTREADOR',
        identificador: idRastreador,
        status: 'INSTALADO',
        tecnicoResponsavelId: tec._id,
        marca: 'Suntech',
        modelo: 'ST310U'
      });

      const chip = await Equipamento.create({
        tipo: 'CHIP',
        identificador: idChip,
        status: 'INSTALADO',
        tecnicoResponsavelId: tec._id,
        operadora: Math.random() > 0.5 ? 'Vivo' : 'Claro',
        numeroLinha: '(11) 9' + String(10000000 + countVeiculos),
        apn: 'smart.m2m'
      });

      // Data de instalação aleatória (Abril, Maio ou Junho de 2026)
      const rand = Math.random();
      let dataInstalacao: Date;
      let mesesFaturamento: number[] = [];

      if (rand < 0.45) {
        // Instalado em Abril 2026 (dia aleatório 1 a 20)
        dataInstalacao = new Date(2026, 3, Math.floor(Math.random()*20)+1, 14, 0, 0);
        mesesFaturamento = [3, 4, 5]; // Abril, Maio, Junho
      } else if (rand < 0.85) {
        // Instalado em Maio 2026
        dataInstalacao = new Date(2026, 4, Math.floor(Math.random()*20)+1, 14, 0, 0);
        mesesFaturamento = [4, 5]; // Maio, Junho
      } else {
        // Instalado em Junho 2026
        dataInstalacao = new Date(2026, 5, Math.floor(Math.random()*15)+1, 14, 0, 0);
        mesesFaturamento = [5]; // Apenas Junho
      }

      countHistoricos++;
      await HistoricoInstalacao.create({
        veiculoId: veiculo._id,
        rastreadorId: rastreador._id,
        chipId: chip._id,
        tecnicoId: tec._id,
        dataInstalacao
      });

      // Gerar mensalidades com status coerentes por mês
      for (const mesIndex of mesesFaturamento) {
        countMensalidades++;
        const valor = 80.00;
        const dataEmissao = new Date(2026, mesIndex, 1);
        const dataVencimento = new Date(2026, mesIndex, 10);
        
        let status: 'PAGO' | 'PENDENTE' | 'ATRASADO' = 'PENDENTE';
        let dataPagamento: Date | undefined;

        if (mesIndex === 3) {
          // Abril: 95% pago
          const rStatus = Math.random();
          if (rStatus < 0.95) {
            status = 'PAGO';
            dataPagamento = new Date(2026, 3, 5 + Math.floor(Math.random() * 5));
          } else {
            status = 'ATRASADO';
          }
        } else if (mesIndex === 4) {
          // Maio: 85% pago, 15% atrasado
          const rStatus = Math.random();
          if (rStatus < 0.85) {
            status = 'PAGO';
            dataPagamento = new Date(2026, 4, 5 + Math.floor(Math.random() * 5));
          } else {
            status = 'ATRASADO';
          }
        } else {
          // Junho (Mês Atual): 15% pago adiantado, 75% pendente, 10% atrasado (vencimento dia 10 e hoje é dia 24, logo quem não pagou está atrasado)
          const rStatus = Math.random();
          if (rStatus < 0.20) {
            status = 'PAGO';
            dataPagamento = new Date(2026, 5, 8);
          } else if (rStatus < 0.90) {
            status = 'ATRASADO'; // passou do dia 10/06
          } else {
            status = 'PENDENTE'; // simulando vencimento postergado ou pendente
          }
        }

        await Mensalidade.create({
          clienteId: cliente._id,
          valor,
          dataEmissao,
          dataVencimento,
          dataPagamento,
          status
        });
      }
    }

    // Atualizar quantidade de veículos no cliente
    await Cliente.findByIdAndUpdate(cliente._id, { veiculosCount: numVeiculos });
  }

  // Equipamentos em estoque
  for (let k = 0; k < 8; k++) {
    await Equipamento.create({
      tipo: 'RASTREADOR',
      identificador: '35829302' + String(2000000 + k),
      status: 'ESTOQUE',
      marca: 'Suntech',
      modelo: 'ST310U'
    });

    await Equipamento.create({
      tipo: 'CHIP',
      identificador: '895510200' + String(2000000000 + k),
      status: 'ESTOQUE',
      operadora: k % 2 === 0 ? 'Vivo' : 'Claro',
      numeroLinha: '(11) 97000-000' + k,
      apn: 'smart.m2m'
    });
  }

  // 10. Criar Ordens de Serviço (Controle operacional)
  const tec2 = tecnicosCriados[1];
  
  // OS Pendente
  const clienteOS1 = await Cliente.findOne({ nome: 'Transportadora LogExpress Ltda' });
  const veiculosOS1 = await Veiculo.find({ clienteId: clienteOS1?._id });
  if (veiculosOS1.length > 0) {
    const rastComTec = await Equipamento.create({
      tipo: 'RASTREADOR',
      identificador: '358293029999991',
      status: 'COM_TECNICO',
      tecnicoResponsavelId: tec2._id,
      marca: 'Suntech',
      modelo: 'ST310U'
    });
    const chipComTec = await Equipamento.create({
      tipo: 'CHIP',
      identificador: '8955102009999999901',
      status: 'COM_TECNICO',
      tecnicoResponsavelId: tec2._id,
      operadora: 'Vivo',
      numeroLinha: '(11) 99999-8888',
      apn: 'smart.m2m'
    });

    await OrdemServico.create({
      tecnicoId: tec2._id,
      veiculoId: veiculosOS1[0]._id,
      rastreadorId: rastComTec._id,
      chipId: chipComTec._id,
      observacoes: 'Instalação pendente de fotos do chicote de fusíveis.',
      status: 'PENDENTE',
      fotosUrls: []
    });
  }

  // OS Agendada
  const clienteOS2 = await Cliente.findOne({ nome: 'Cooperativa de Vans TransLeste' });
  const veiculosOS2 = await Veiculo.find({ clienteId: clienteOS2?._id });
  if (veiculosOS2.length > 0) {
    const rastComTec2 = await Equipamento.create({
      tipo: 'RASTREADOR',
      identificador: '358293029999992',
      status: 'COM_TECNICO',
      tecnicoResponsavelId: tec2._id,
      marca: 'Suntech',
      modelo: 'ST310U'
    });
    const chipComTec2 = await Equipamento.create({
      tipo: 'CHIP',
      identificador: '8955102009999999902',
      status: 'COM_TECNICO',
      tecnicoResponsavelId: tec2._id,
      operadora: 'Claro',
      numeroLinha: '(11) 99999-7777',
      apn: 'claro.m2m'
    });

    await OrdemServico.create({
      tecnicoId: tec2._id,
      veiculoId: veiculosOS2[0]._id,
      rastreadorId: rastComTec2._id,
      chipId: chipComTec2._id,
      observacoes: 'Visita agendada para o sábado de manhã no pátio.',
      status: 'AGENDADA',
      fotosUrls: []
    });
  }

  return {
    tecnicos: tecnicosCriados.length,
    clientes: templatesClientes.length,
    veiculos: countVeiculos,
    equipamentos: countEquipamentos + 16 + 4, // Instalados + Estoque + OS
    historicos: countHistoricos,
    mensalidades: countMensalidades,
    categorias: 5,
    despesas: despesasDados.length,
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
