export interface ClienteMock {
  id: string;
  nome: string;
  documento: string;
  email: string;
  whatsapp: string;
  veiculosCount: number;
}

export interface TecnicoMock {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

export interface EquipamentoMock {
  id: string;
  tipo: 'RASTREADOR' | 'CHIP';
  identificador: string;
  status: 'ESTOQUE' | 'COM_TECNICO' | 'INSTALADO' | 'DEFEITUOSO';
  tecnico?: string;
}

export interface OSMock {
  id: string;
  tecnico: string;
  cliente: string;
  placa: string;
  rastreador: string;
  chip: string;
  status: 'PENDENTE' | 'APROVADO';
  data: string;
}

export interface DespesaMock {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
}

export const clientesMockData: ClienteMock[] = [
  { id: '1', nome: 'Transportadora TransFast', documento: '12.345.678/0001-90', email: 'contato@transfast.com', whatsapp: '(11) 98765-4321', veiculosCount: 8 },
  { id: '2', nome: 'Ana Júlia Medeiros', documento: '456.789.123-00', email: 'anajulia@gmail.com', whatsapp: '(21) 99888-7766', veiculosCount: 2 },
  { id: '3', nome: 'Cooperativa TaxiRio', documento: '98.765.432/0001-10', email: 'financeiro@taxirio.com', whatsapp: '(21) 97777-6655', veiculosCount: 15 },
  { id: '4', nome: 'Carlos Eduardo Souza', documento: '321.654.987-11', email: 'carlosedu@yahoo.com.br', whatsapp: '(19) 99123-4567', veiculosCount: 1 },
];

export const tecnicosMockData: TecnicoMock[] = [
  { id: '101', nome: 'Roberto Alves da Silva', telefone: '(11) 96543-2100', ativo: true },
  { id: '102', nome: 'Carlos Magno Torres', telefone: '(21) 95432-1098', ativo: true },
  { id: '103', nome: 'Felipe Santana Lima', telefone: '(19) 94321-0987', ativo: true },
];

export const equipamentosMockData: EquipamentoMock[] = [
  { id: '201', tipo: 'RASTREADOR', identificador: 'IMEI 358293029384729', status: 'INSTALADO', tecnico: 'Roberto Alves da Silva' },
  { id: '202', tipo: 'RASTREADOR', identificador: 'IMEI 358293029384812', status: 'ESTOQUE' },
  { id: '203', tipo: 'RASTREADOR', identificador: 'IMEI 358293029384931', status: 'COM_TECNICO', tecnico: 'Felipe Santana Lima' },
  { id: '204', tipo: 'CHIP', identificador: 'ICCID 8955102003948576201', status: 'INSTALADO', tecnico: 'Roberto Alves da Silva' },
  { id: '205', tipo: 'CHIP', identificador: 'ICCID 8955102003948576302', status: 'ESTOQUE' },
  { id: '206', tipo: 'CHIP', identificador: 'ICCID 8955102003948576409', status: 'DEFEITUOSO', tecnico: 'Carlos Magno Torres' },
];

export const ordensMockData: OSMock[] = [
  { id: 'OS-001', tecnico: 'Felipe Santana Lima', cliente: 'Ana Júlia Medeiros', placa: 'KRT-5H21', rastreador: 'IMEI 358293029384931', chip: 'ICCID 8955102003948576302', status: 'PENDENTE', data: '23/06/2026' },
];

export const despesasMockData: DespesaMock[] = [
  { id: 'd1', descricao: 'Compra de 20 chips M2M Vivo', valor: 250.00, data: '2026-06-15', categoria: 'Chips' },
  { id: 'd2', descricao: 'Combustível visita técnica', valor: 120.00, data: '2026-06-18', categoria: 'Combustível' },
  { id: 'd3', descricao: 'Aluguel do escritório mensal', valor: 1200.00, data: '2026-06-05', categoria: 'Aluguel' },
  { id: 'd4', descricao: 'Placa de publicidade da loja', valor: 350.00, data: '2026-06-10', categoria: 'Marketing' },
];
