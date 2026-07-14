import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { GestaoUsuarios } from './components/GestaoUsuarios';
import { Dashboard } from './components/dashboard/Dashboard';
import { Topbar } from './components/layout/Topbar';
import './App.css';
import { api, type Cliente, type Tecnico, type Equipamento, type OrdemServico, type Fatura, type Despesa, type CategoriaDespesa, type Plano, type FaixaPreco } from './services/api';
import { maskCpfCnpj, maskTelefone, maskPlaca } from './utils/masks';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  // Controle de Visualização, Autenticação e Perfis
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('aprastro_token') : null);
  const [userRole, setUserRole] = useState<'admin' | 'tecnico'>('admin');
  const [userName, setUserName] = useState<string>('Usuário');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('aprastro_user') : null;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserRole(parsed.role || 'tecnico');
        setUserName(parsed.nome || 'Usuário');
      } catch(e){}
    }
  }, [token]);

  const handleLogin = (newToken: string, user: any) => {
    localStorage.setItem('aprastro_token', newToken);
    localStorage.setItem('aprastro_user', JSON.stringify(user));
    setToken(newToken);
    setUserRole(user.role);
    setUserName(user.nome);
    setCurrentPage(user.role === 'admin' ? 'dashboard' : 'tecnico-caixa');
  };

  const handleLogout = () => {
    localStorage.removeItem('aprastro_token');
    localStorage.removeItem('aprastro_user');
    setToken(null);
    setCurrentPage('dashboard');
  };

  // Estados dos Planos
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [financeiroTab, setFinanceiroTab] = useState<'faturas' | 'planos'>('faturas');
  const [isCriandoPlano, setIsCriandoPlano] = useState<boolean>(false);
  const [newPlano, setNewPlano] = useState({
    nome: '',
    tipoCobranca: 'POR_VEICULO' as 'POR_VEICULO' | 'FIXO_GLOBAL' | 'ESCALONADO_FROTA',
    periodicidade: 'MENSAL' as 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    valorBase: '',
    fidelidadeMeses: '0',
    descontoFidelidadePct: '0',
    descricao: ''
  });
  const [faixasPreco, setFaixasPreco] = useState<FaixaPreco[]>([{ de: 1, ate: undefined, valor: 80 }]);

  // Estados da Central de Suporte & Chamados
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [supportTab, setSupportTab] = useState<'faq' | 'ticket'>('faq');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [supportForm, setSupportForm] = useState({ pagina: 'Dashboard', tipoErro: 'Bug na Interface', descricao: '' });
  const [supportSending, setSupportSending] = useState<boolean>(false);
  const [supportSuccessTicketId, setSupportSuccessTicketId] = useState<string | null>(null);
  const [supportMailtoUrl, setSupportMailtoUrl] = useState<string>('');
  const [supportError, setSupportError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState<boolean>(false);

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.descricao.trim()) {
      setSupportError('Por favor, descreva o problema.');
      return;
    }

    setSupportSending(true);
    setSupportError(null);
    setSupportSuccessTicketId(null);

    try {
      const ticket = await api.tickets.create({
        usuarioNome: userName,
        usuarioRole: userRole,
        pagina: supportForm.pagina,
        tipoErro: supportForm.tipoErro,
        descricao: supportForm.descricao
      });
      setSupportSuccessTicketId(ticket.ticketId || ticket._id);
      
      // Redireciona para o cliente de e-mail do usuário (Outlook/Gmail) preenchido
      const subject = encodeURIComponent(`[AP RASTRO] Novo Chamado Registrado - ${ticket.ticketId || ticket._id}`);
      const body = encodeURIComponent(`Olá, Equipe Técnica da AP RASTRO,\n\nUm novo chamado de suporte foi aberto e exige atenção:\n\n• ID do Chamado: ${ticket.ticketId || ticket._id}\n• Solicitante: ${userName}\n• Tela/Origem: ${supportForm.pagina}\n• Categoria: ${supportForm.tipoErro}\n• Descrição:\n"${supportForm.descricao}"\n\nPor favor, acesse o painel para maiores detalhes.`);
      
      const mailtoUrl = `mailto:ANDREWLAMEIRA30@GMAIL.COM?subject=${subject}&body=${body}`;
      setSupportMailtoUrl(mailtoUrl);
      
      // Cria um elemento <a> temporário para tentar abrir direto
      try {
        const link = document.createElement('a');
        link.href = mailtoUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {}

      setSupportForm({ pagina: 'Dashboard', tipoErro: 'Bug na Interface', descricao: '' });
    } catch (err: any) {
      console.error('Erro ao enviar ticket:', err);
      setSupportError(err.message || 'Ocorreu um erro ao enviar o chamado de suporte.');
    } finally {
      setSupportSending(false);
    }
  };

  // Estados reais integrados à API (MongoDB)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesInativos, setClientesInativos] = useState<Cliente[]>([]);
  const [mostrarInativos, setMostrarInativos] = useState<boolean>(false);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [isFaturaModalOpen, setIsFaturaModalOpen] = useState(false);
  const [editFatura, setEditFatura] = useState<any>(null);
  const [checkoutFaturaId, setCheckoutFaturaId] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState({
    desconto: 0,
    acrescimo: 0,
    valorPago: 0,
    dataPagamento: new Date().toISOString().split('T')[0],
    formaPagamento: 'PIX',
    novaDataVencimento: ''
  });
  const [showInativarModal, setShowInativarModal] = useState(false);
  const [clienteParaInativar, setClienteParaInativar] = useState<string | null>(null);
  const [motivoInativacao, setMotivoInativacao] = useState('');
  const [detalhesInativacao, setDetalhesInativacao] = useState('');
  
  const [newFatura, setNewFatura] = useState({ clienteId: '', valor: '', dataVencimento: new Date().toISOString().split('T')[0], status: 'PENDENTE', observacao: '' });
  const [selectedFaturasIds, setSelectedFaturasIds] = useState<string[]>([]);
  const [selectedFaturasGeraisIds, setSelectedFaturasGeraisIds] = useState<string[]>([]);

  // --- MÁSCARAS DE INPUT ---
  // @ts-ignore
  const mascaraDocumento = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return v.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").substring(0, 18);
    }
  };

  const mascaraPlaca = (value: string) => {
    let v = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (v.length > 3) {
      return v.slice(0, 3) + "-" + v.slice(3, 7);
    }
    return v;
  };
  // -------------------------

  // Estados dos formulários de cadastro
  const [newCliente, setNewCliente] = useState({ nome: '', documento: '', email: '', whatsapp: '', planoId: '', diaVencimento: 10, indicacao: '' });
  const [veiculosCliente, setVeiculosCliente] = useState<{placa: string, marca: string, modelo: string, cor: string, ano: string, rastreadorId: string}[]>([]);
  const [newTecnico, setNewTecnico] = useState({ nome: '', telefone: '' });
  const [newDespesa, setNewDespesa] = useState({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: '' });
  const [newOS, setNewOS] = useState({ placa: '', clienteId: '', rastreadorId: '', observacoes: '', fotosUrls: [] as string[] });

  const [selectedOSId, setSelectedOSId] = useState<string>('avulsa');
  
  const [scheduleOS, setScheduleOS] = useState({
    clienteId: '',
    placa: '',
    tecnicoId: '',
    rastreadorId: '',
    observacoes: ''
  });

  const [selectedClientePanorama, setSelectedClientePanorama] = useState<any>(null);
  const [fichaTab, setFichaTab] = useState<'veiculos' | 'historico' | 'financeiro'>('veiculos');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  
  // Cadastro de Frota em Massa
  const [isAddingFrota, setIsAddingFrota] = useState<boolean>(false);
  const [frotaRows, setFrotaRows] = useState([{ placa: '', marca: '', modelo: '', cor: '', ano: '', imei: '', iccid: '' }]);

  const handleSelectAgendamento = (osId: string) => {
    setSelectedOSId(osId);
    if (osId === 'avulsa') {
      setNewOS({ placa: '', clienteId: '', rastreadorId: '', observacoes: '', fotosUrls: [] });
    } else {
      const os = ordens.find(o => o._id === osId);
      if (os) {
        setNewOS({
          placa: (os.veiculoId as any)?.placa || '',
          clienteId: (os.veiculoId as any)?.clienteId?._id || (os.veiculoId as any)?.clienteId || '',
          rastreadorId: (os.rastreadorId as any)?._id || os.rastreadorId || '',
          observacoes: os.observacoes || '',
          fotosUrls: os.fotosUrls || []
        });
      }
    }
  };

  // Estados de Busca e Filtros
  const [filtroDespesaMes, setFiltroDespesaMes] = useState<string>('todos');
  const [filtroDespesaCat, setFiltroDespesaCat] = useState<string>('todos');
  const [buscaDespesa, setBuscaDespesa] = useState<string>('');
  const [buscaHistorico, setBuscaHistorico] = useState<string>('');
  const [historicoResult, setHistoricoResult] = useState<string[]>([]);
  const [historicoTipo, setHistoricoTipo] = useState<'veiculo' | 'rastreador'>('veiculo');
  const [filtroFaturaCliente, setFiltroFaturaCliente] = useState<string>('');
  const [filtroFaturaStatus, setFiltroFaturaStatus] = useState<string>('todos');
  const [agruparFinanceiro, setAgruparFinanceiro] = useState<boolean>(true);

  // Estados de Busca Global (Buque)
  const [buscaCliente, setBuscaCliente] = useState<string>('');
  const [buscaEstoque, setBuscaEstoque] = useState<string>('');
  
  // Estados de Modais de Edição
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [editVeiculo, setEditVeiculo] = useState<any | null>(null);
  const [editEquipamento, setEditEquipamento] = useState<Equipamento | null>(null);

  // Estados do Módulo de Estoque
  const [filtroEstoqueTipo, setFiltroEstoqueTipo] = useState<string>('todos');
  const [filtroEstoqueStatus, setFiltroEstoqueStatus] = useState<string>('todos');
  const [transferindoId, setTransferindoId] = useState<string | null>(null);
  const [tecnicoParaTransferencia, setTecnicoParaTransferencia] = useState<string>('');
  const [newEquipamento, setNewEquipamento] = useState({ identificador: '', iccid: '', marca: '', modelo: '', numeroLinha: '', operadora: '', apn: '', observacoes: '' });

  // Carregar dados gerais do banco de dados
  const carregarDados = async () => {
    try {
      const [dataClientes, dataTecnicos, dataEquipamentos, dataOrdens, dataCategorias, dataFaturas, dataPlanos] = await Promise.all([
        api.clientes.list(),
        api.tecnicos.list(),
        api.equipamentos.list(),
        api.ordens.list(),
        api.caixa.listCategorias(),
        api.financeiro.list(),
        api.planos.list()
      ]);

      setClientes(dataClientes);
      setTecnicos(dataTecnicos);
      setEquipamentos(dataEquipamentos);
      setOrdens(dataOrdens);
      setCategorias(dataCategorias);
      setFaturas(dataFaturas);
      setPlanos(dataPlanos);

      // Setar categoria inicial se houver
      if (dataCategorias.length > 0 && !newDespesa.categoria) {
        setNewDespesa(prev => ({ ...prev, categoria: dataCategorias[0]._id }));
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados da API do AP RASTRO:", err);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    carregarDados();
  }, []);

  // O React Hot Toast e o Lazy Loading real exigiria endpoints dedicados para o Dashboard.
  // Como otimização imediata anti-lentidão: Carregar apenas uma vez no boot (e não a cada clique de aba).
  // As funções de salvar/editar já chamam carregarDados() localmente após o sucesso.
  // useEffect(() => {
  //   carregarDados();
  // }, [currentPage]);

  // Ao trocar de perfil de usuário, ajusta a página ativa padrão
  useEffect(() => {
    if (userRole === 'tecnico') {
      setCurrentPage('tecnico-caixa');
    } else {
      setCurrentPage('dashboard');
      setUserName('Andrew Gerente');
    }
  }, [userRole]);

  // Atualiza o nome do técnico se o perfil for técnico e os técnicos forem carregados
  useEffect(() => {
    if (userRole === 'tecnico' && tecnicos.length > 0) {
      const felipe = tecnicos.find(t => t.nome.toLowerCase().includes('felipe'));
      if (felipe) {
        setUserName(felipe.nome);
      } else {
        setUserName('Roberto Alves (Técnico)');
      }
    }
  }, [userRole, tecnicos]);

  // Carregamento dinâmico e filtragem de despesas
  const [despesasFiltradas, setDespesasFiltradas] = useState<Despesa[]>([]);
  useEffect(() => {
    const filtrarDespesas = async () => {
      try {
        const res = await api.caixa.listDespesas({
          busca: buscaDespesa,
          categoriaId: filtroDespesaCat === 'todos' ? undefined : filtroDespesaCat,
          mes: filtroDespesaMes === 'todos' ? undefined : filtroDespesaMes
        });
        setDespesasFiltradas(res.despesas);
        // Atualizar também o estado global de despesas se o filtro for global
        if (buscaDespesa === '' && filtroDespesaCat === 'todos' && filtroDespesaMes === 'todos') {
          setDespesas(res.despesas);
        }
      } catch (err) {
        console.error("Erro ao listar despesas filtradas:", err);
      }
    };
    filtrarDespesas();
  }, [buscaDespesa, filtroDespesaCat, filtroDespesaMes, despesas]);

  // Cálculos Financeiros Dinâmicos baseados nos Planos Reais dos Clientes
  const calcularMRRCliente = (c: any) => {
    const veiculosCount = c.veiculosCount || 0;
    if (veiculosCount === 0) return 0;

    let valorCliente = veiculosCount * 80.00; // Fallback default
    const plano = c.planoId as any;

    if (plano) {
      let valorOriginal = 0;
      if (plano.tipoCobranca === 'POR_VEICULO') {
        valorOriginal = veiculosCount * plano.valorBase;
      } else if (plano.tipoCobranca === 'FIXO_GLOBAL') {
        valorOriginal = plano.valorBase;
      } else if (plano.tipoCobranca === 'ESCALONADO_FROTA') {
        const faixas = plano.faixasPreco || [];
        const faixa = faixas.find((f: any) => veiculosCount >= f.de && (!f.ate || veiculosCount <= f.ate));
        const valorUnitario = faixa ? faixa.valor : 80.00;
        valorOriginal = veiculosCount * valorUnitario;
      }

      // Desconto de fidelidade
      if (plano.descontoFidelidadePct > 0) {
        const desconto = valorOriginal * (plano.descontoFidelidadePct / 100);
        valorOriginal = valorOriginal - desconto;
      }

      valorCliente = valorOriginal;
    }
    return valorCliente;
  };

  const clientesAtivosFiltered = clientes.filter(c => c.ativo);
  const clientesInativosFiltered = clientes.filter(c => !c.ativo);

  const totalReceitaEstimada = clientesAtivosFiltered.reduce((acc, c) => acc + calcularMRRCliente(c), 0);
  const mrrPerdido = clientesInativosFiltered.reduce((acc, c) => acc + calcularMRRCliente(c), 0);
  const taxaChurn = clientes.length > 0 ? (clientesInativosFiltered.length / clientes.length) * 100 : 0;

  // Dados do Gráfico de Pareto (Regra 80/20)
  const motivosPareto = clientesInativosFiltered.reduce((acc: Record<string, number>, c) => {
    const motivo = c.motivoInativacao || 'N/A';
    acc[motivo] = (acc[motivo] || 0) + 1;
    return acc;
  }, {});

  const paretoData: { name: string; count: number; cumulativePercent: number }[] = Object.entries(motivosPareto)
    .map(([name, count]) => ({ name, count, cumulativePercent: 0 }))
    .sort((a, b) => b.count - a.count);

  let cumulativeCount = 0;
  const totalInativos = clientesInativosFiltered.length;
  paretoData.forEach(d => {
    cumulativeCount += d.count;
    (d as any).cumulativePercent = totalInativos > 0 ? (cumulativeCount / totalInativos) * 100 : 0;
  }); 
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const lucroReal = faturas.filter(m => m.status === 'PAGO' || m.status === 'PARCIAL').reduce((acc, m) => acc + (m.valorPago != null ? m.valorPago : m.valor), 0) - totalDespesas;

  // Filtrar dados por mês (Abril, Maio, Junho de 2026) para o gráfico de fluxo de caixa
  const obterFluxoMes = (mesZeroIndexed: number) => {
    const descMes = despesas.filter(d => {
      const data = new Date(d.data);
      return data.getFullYear() === 2026 && data.getMonth() === mesZeroIndexed;
    }).reduce((acc, d) => acc + d.valor, 0);

    const recMes = faturas.filter(m => {
      const data = new Date(m.dataPagamento || m.dataVencimento);
      return data.getFullYear() === 2026 && data.getMonth() === mesZeroIndexed && m.status === 'PAGO';
    }).reduce((acc, m) => acc + m.valor, 0);

    return { receita: recMes, despesa: descMes };
  };

  const fluxoAbril = obterFluxoMes(3);
  const fluxoMaio = obterFluxoMes(4);
  const fluxoJunho = obterFluxoMes(5);

  // Escala proporcional dinâmica do gráfico de barras para evitar overflow
  const maxVal = Math.max(fluxoAbril.receita, fluxoAbril.despesa, fluxoMaio.receita, fluxoMaio.despesa, fluxoJunho.receita, fluxoJunho.despesa, 1000);

  // Contagem de Veículos (Chips não são computados como dispositivos ativos)
  const totalVeiculosMonitorados = clientes.reduce((acc, c) => acc + (c.veiculosCount || 0), 0);

  // Achar o técnico logado para filtrar seus serviços agendados
  const tecnicoLogadoParaAgendamentos = tecnicos.find(t => t.nome === userName);
  const ordensAgendadasDoTecnico = ordens.filter(o => 
    (o.status === 'AGENDADA' || o.status === 'REJEITADO') && 
    (typeof o.tecnicoId === 'string' ? o.tecnicoId === tecnicoLogadoParaAgendamentos?._id : o.tecnicoId?._id === tecnicoLogadoParaAgendamentos?._id)
  );

  // Métricas do Donut Financeiro de Faturas (Contagem e Valores em Reais R$)
  const faturasPagasCount = faturas.filter(m => m.status === 'PAGO' || m.status === 'PARCIAL').length;
  const faturasPendentesCount = faturas.filter(m => m.status === 'PENDENTE').length;
  const faturasAtrasadasCount = faturas.filter(m => m.status === 'ATRASADO').length;

  const valorFaturasPagas = faturas.filter(m => m.status === 'PAGO' || m.status === 'PARCIAL').reduce((acc, m) => acc + (m.valorPago != null ? m.valorPago : m.valor), 0);
  const valorFaturasPendentes = faturas.filter(m => m.status === 'PENDENTE').reduce((acc, m) => acc + m.valor, 0);
  const valorFaturasAtrasadas = faturas.filter(m => m.status === 'ATRASADO').reduce((acc, m) => acc + m.valor, 0);

  const totalValorFaturas = valorFaturasPagas + valorFaturasPendentes + valorFaturasAtrasadas;
  const pctPagas = totalValorFaturas > 0 ? (valorFaturasPagas / totalValorFaturas) : 0;
  const pctPendentes = totalValorFaturas > 0 ? (valorFaturasPendentes / totalValorFaturas) : 0;
  const pctAtrasadas = totalValorFaturas > 0 ? (valorFaturasAtrasadas / totalValorFaturas) : 0;

  // offsets do Donut segmentado (Pagas, Pendentes, Atrasadas)
  const offsetPagas = 251.2 * (1 - pctPagas);
  const offsetPendentes = 251.2 * (1 - (pctPagas + pctPendentes));
  const offsetAtrasadas = 251.2 * (1 - (pctPagas + pctPendentes + pctAtrasadas));

  // Handler para cadastrar cliente
  const handleAddCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.nome || !newCliente.documento) return;
    try {
      // Cria cliente e veículos
      const createdCliente = await api.clientes.create({ ...newCliente, veiculos: veiculosCliente });
      setNewCliente({ nome: '', documento: '', email: '', whatsapp: '', planoId: '', diaVencimento: 10, indicacao: '' });
      setVeiculosCliente([]);
      toast.success('Cliente e Veículos cadastrados com sucesso!');
      // Carrega ficha do cliente recém‑criado
      const panorama = await api.clientes.panorama(createdCliente._id);
      setSelectedClientePanorama(panorama);
      setFichaTab('veiculos');
      setIsAddingFrota(true); // Abre o formulário de cadastro rápido automaticamente
      setCurrentPage('clientes-ficha'); // Redireciona para a ficha com aba veículos aberta
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao cadastrar cliente: ' + err.message);
    }
  };

  // Handler para cadastrar técnico
  const handleAddTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTecnico.nome) return;
    try {
      await api.tecnicos.create(newTecnico);
      setNewTecnico({ nome: '', telefone: '' });
      toast.success('Técnico cadastrado com sucesso!');
      carregarDados();
      setCurrentPage('tecnicos'); // Redireciona de volta para a listagem
    } catch (err: any) {
      toast.success('Erro ao cadastrar técnico: ' + err.message);
    }
  };

  // Handler para cadastrar despesa
  const handleAddDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDespesa.descricao || !newDespesa.valor || !newDespesa.categoria) return;
    try {
      await api.caixa.createDespesa({
        descricao: newDespesa.descricao,
        valor: parseFloat(newDespesa.valor),
        categoriaId: newDespesa.categoria,
        data: newDespesa.data
      });
      setNewDespesa({ 
        descricao: '', 
        valor: '', 
        data: new Date().toISOString().split('T')[0], 
        categoria: categorias[0]?._id || '' 
      });
      toast.success('Despesa lançada com sucesso!');
      carregarDados();
      setCurrentPage('caixa'); // Redireciona de volta para a listagem
    } catch (err: any) {
      toast.success('Erro ao lançar despesa: ' + err.message);
    }
  };

  // Handler de Upload de Foto do Técnico
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const res = await api.upload(file);
      setNewOS(prev => ({
        ...prev,
        fotosUrls: [...prev.fotosUrls, res.url]
      }));
      toast.success('Foto carregada com sucesso!');
    } catch (err: any) {
      toast.success('Erro ao enviar foto: ' + err.message);
    }
  };

  // Handler do Técnico enviando O.S.
  const handleSendOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOS.placa || !newOS.clienteId || !newOS.rastreadorId) {
      toast.error('Ocorreu um erro');
      return;
    }

    // Achar o técnico logado
    const tecnicoLogado = tecnicos.find(t => t.nome === userName);
    if (!tecnicoLogado) {
      toast.error('Ocorreu um erro');
      return;
    }

    try {
      if (selectedOSId !== 'avulsa') {
        // Concluir uma O.S. agendada existente
        await api.ordens.concluir(selectedOSId, {
          observacoes: newOS.observacoes,
          fotosUrls: newOS.fotosUrls
        });
        toast.success('Instalação da O.S. Agendada enviada com sucesso para homologação!');
      } else {
        // Criar uma nova O.S. avulsa
        await api.ordens.create({
          tecnicoId: tecnicoLogado._id,
          clienteId: newOS.clienteId,
          placa: newOS.placa,
          rastreadorId: newOS.rastreadorId,
          observacoes: newOS.observacoes,
          fotosUrls: newOS.fotosUrls
        });
        toast.success('Ordem de serviço avulsa enviada para aprovação do Administrador!');
      }
      setSelectedOSId('avulsa');
      setNewOS({ placa: '', clienteId: '', rastreadorId: '', observacoes: '', fotosUrls: [] });
      carregarDados();
      setCurrentPage('tecnico-caixa');
    } catch (err: any) {
      toast.success('Erro ao enviar O.S.: ' + err.message);
    }
  };

  const handleSalvarFrota = async () => {
    if (!selectedClientePanorama) return;
    
    // Filtra apenas linhas que tenham a placa preenchida (obrigatório)
    const veiculosValidos = frotaRows.filter(r => r.placa.trim() !== '');
    if (veiculosValidos.length === 0) {
      toast.error('Ocorreu um erro');
      return;
    }

    try {
      await api.veiculos.bulkCreate({
        clienteId: selectedClientePanorama.cliente._id,
        veiculos: veiculosValidos
      });
      toast.success('Frota cadastrada com sucesso!');
      setIsAddingFrota(false);
      setFrotaRows([{ placa: '', marca: '', modelo: '', cor: '', ano: '', imei: '', iccid: '' }]);
      
      // Recarrega a ficha do cliente
      const panorama = await api.clientes.panorama(selectedClientePanorama.cliente._id);
      setSelectedClientePanorama(panorama);
      carregarDados();
    } catch (err: any) {
      const data = err.response?.data;
      let msg = data?.message || err.message;
      if (data?.imeisInvalidos?.length > 0) {
        msg += '\n\nIMEIs não encontrados no estoque:\n- ' + data.imeisInvalidos.join('\n- ');
      }
      toast.success('Erro ao salvar frota:\n' + msg);
    }
  };

  const handleScheduleOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleOS.clienteId || !scheduleOS.placa || !scheduleOS.tecnicoId || !scheduleOS.rastreadorId) {
      toast.error('Ocorreu um erro');
      return;
    }

    try {
      await api.ordens.create({
        tecnicoId: scheduleOS.tecnicoId,
        clienteId: scheduleOS.clienteId,
        placa: scheduleOS.placa.toUpperCase(),
        rastreadorId: scheduleOS.rastreadorId,
        observacoes: scheduleOS.observacoes,
        status: 'AGENDADA',
        fotosUrls: []
      });

      toast.success('Instalação agendada e enviada para a Caixa de Entrada do Técnico!');
      setScheduleOS({ clienteId: '', placa: '', tecnicoId: '', rastreadorId: '', observacoes: '' });
      carregarDados();
      setCurrentPage('ordens');
    } catch (err: any) {
      toast.success('Erro ao agendar O.S.: ' + err.message);
    }
  };

  const handleInativarCliente = (clienteId: string) => {
    setClienteParaInativar(clienteId);
    setMotivoInativacao('');
    setDetalhesInativacao('');
    setShowInativarModal(true);
  };

  const confirmInativarCliente = async () => {
    if (!clienteParaInativar) return;
    if (!motivoInativacao) {
      toast.error('Ocorreu um erro');
      return;
    }
    try {
      const nomeOperador = userName || 'Operador';
      await api.clientes.delete(clienteParaInativar, { 
        motivoInativacao: motivoInativacao,
        detalhesInativacao: detalhesInativacao,
        operadorCancelamento: nomeOperador 
      });
      toast.success('Cliente inativado com sucesso. Ele parará de gerar faturas.');
      setShowInativarModal(false);
      setClienteParaInativar(null);
      setSelectedClientePanorama(null);
      setCurrentPage('clientes');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao inativar cliente: ' + err.message);
    }
  };

  const handleToggleInativos = async () => {
    if (!mostrarInativos) {
      try {
        const inativos = await api.clientes.list({ ativo: 'false' });
        setClientesInativos(inativos);
      } catch (err) {
        console.error('Erro ao buscar inativos', err);
      }
    }
    setMostrarInativos(!mostrarInativos);
  };

  const gerarRelatorioChurn = async () => {
    try {
      let inativosParaRelatorio = clientesInativos;
      if (!mostrarInativos || inativosParaRelatorio.length === 0) {
        inativosParaRelatorio = await api.clientes.list({ ativo: 'false' });
      }

      if (inativosParaRelatorio.length === 0) {
        toast.success('Nenhum cliente inativo encontrado para gerar relatório.');
        return;
      }

      const doc = new jsPDF();
      
      // Cabecalho
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 102);
      doc.text('AP RASTRO - Relatorio de Cancelamentos (Churn)', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Data de Emissao: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

      // Tabela
      const tableColumn = ["Cliente", "Motivo", "Operador", "Data Inativacao"];
      const tableRows: any[] = [];

      inativosParaRelatorio.forEach(cliente => {
        const clienteData = [
          cliente.nome,
          cliente.motivoInativacao || 'Nao Informado',
          cliente.operadorCancelamento || 'Sistema',
          cliente.dataInativacao ? new Date(cliente.dataInativacao).toLocaleDateString('pt-BR') : 'Desconhecida'
        ];
        tableRows.push(clienteData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 51, 102] }
      });

      // Rodape
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Pagina ${i} de ${pageCount} - Gerado pelo Sistema AP RASTRO`, 14, doc.internal.pageSize.height - 10);
      }

      doc.save(`relatorio_cancelamentos_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar relatorio PDF', err);
      toast.error('Erro ao gerar relatório');
    }
  };

  const handleAbrirFichaCliente = async (clienteId: string) => {
    try {
      const panorama = await api.clientes.panorama(clienteId);
      setSelectedClientePanorama(panorama);
      setFichaTab('veiculos');
      setCurrentPage('clientes-ficha');
    } catch (err: any) {
      toast.success('Erro ao carregar a ficha do cliente: ' + err.message);
    }
  };

  // Admin aprova O.S.
  const handleApproveOS = async (osId: string) => {
    try {
      await api.ordens.approve(osId);
      toast.success('Instalação aprovada e veículo ativo no faturamento!');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao aprovar O.S.: ' + err.message);
    }
  };

  // Admin rejeita O.S.
  const handleRejectOS = async (osId: string) => {
    const motivo = prompt('Por favor, informe o motivo de rejeição da O.S.:');
    if (!motivo) return;
    try {
      await api.ordens.reject(osId, motivo);
      toast.success('Ordem de serviço devolvida ao técnico!');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao rejeitar O.S.: ' + err.message);
    }
  };

  const handleCreateFatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.financeiro.createAvulsa(newFatura);
      toast.success('Fatura avulsa criada com sucesso!');
      setIsFaturaModalOpen(false);
      carregarDados();
    } catch (err: any) {
      toast.success('Erro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFaturaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFatura || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.financeiro.update(editFatura._id, {
        valor: editFatura.valor,
        dataVencimento: editFatura.dataVencimento,
        status: editFatura.status,
        observacao: editFatura.observacao
      });
      toast.success('Fatura atualizada com sucesso!');
      setEditFatura(null);
      carregarDados();
    } catch (err: any) {
      toast.success('Erro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFatura = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta fatura?')) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.financeiro.delete(id);
      toast.success('Fatura excluída com sucesso!');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleBulkCheckout = async () => {
    if (selectedFaturasGeraisIds.length === 0) return;
    if (confirm(`Confirmar baixa (pagamento) de ${selectedFaturasGeraisIds.length} fatura(s)?`)) {
      try {
        await api.financeiro.bulkCheckout(selectedFaturasGeraisIds, 'Massa');
        toast.success('Faturas baixadas com sucesso!');
        setSelectedFaturasGeraisIds([]);
        carregarDados();
      } catch (err: any) {
        toast.success('Erro ao dar baixa nas faturas: ' + err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFaturasGeraisIds.length === 0) return;
    if (confirm(`Atenção: Você está prestes a EXCLUIR ${selectedFaturasGeraisIds.length} fatura(s). Esta ação não pode ser desfeita. Confirmar exclusão?`)) {
      try {
        await api.financeiro.bulkDelete(selectedFaturasGeraisIds);
        toast.success('Faturas excluídas com sucesso!');
        setSelectedFaturasGeraisIds([]);
        carregarDados();
      } catch (err: any) {
        toast.success('Erro ao excluir as faturas: ' + err.message);
      }
    }
  };

  const handleBulkDeleteFaturas = async () => {
    if (selectedFaturasIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir as ${selectedFaturasIds.length} faturas selecionadas?`)) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.financeiro.bulkDelete(selectedFaturasIds);
      toast.success('Faturas excluídas com sucesso!');
      setSelectedFaturasIds([]);
      carregarDados();
      if (selectedClientePanorama) {
        const panorama = await api.clientes.panorama(selectedClientePanorama.cliente._id);
        setSelectedClientePanorama(panorama);
      }
    } catch (err: any) {
      toast.success('Erro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCheckout = (m: any) => {
    setCheckoutFaturaId(m);
    setCheckoutData({
      desconto: 0,
      acrescimo: 0,
      valorPago: m.valor,
      dataPagamento: new Date().toISOString().split('T')[0],
      formaPagamento: 'PIX',
      novaDataVencimento: ''
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutFaturaId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.financeiro.checkout(checkoutFaturaId._id, checkoutData);
      toast.success('Checkout processado com sucesso! Protocolo: ' + (res.fatura?.protocolo || res.faturaOrigem?.protocolo));
      setCheckoutFaturaId(null);
      carregarDados();
      // If we are in Ficha do Cliente, reload panorama
      if (selectedClientePanorama) {
        const panorama = await api.clientes.panorama(selectedClientePanorama.cliente._id);
        setSelectedClientePanorama(panorama);
      }
    } catch (err: any) {
      toast.success('Erro no checkout: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin força faturamento
  const handleForcarFaturamento = async () => {
    try {
      const res = await api.financeiro.faturarCron();
      toast.success(`Ciclo de faturamento processado com sucesso! Faturas geradas: ${res.faturasGeradas}`);
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao rodar faturamento automático: ' + err.message);
    }
  };

  // Cadastrar Novo Plano de Cobrança
  const handleAddPlano = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlano.nome || !newPlano.tipoCobranca) return;
    
    try {
      let faixasValidadas: FaixaPreco[] = [];
      if (newPlano.tipoCobranca === 'ESCALONADO_FROTA') {
        faixasValidadas = faixasPreco.map(f => ({
          de: Number(f.de),
          ate: f.ate ? Number(f.ate) : undefined,
          valor: Number(f.valor)
        }));
        if (faixasValidadas.length === 0) {
          toast.error('Preencha os campos');
          return;
        }
      }

      await api.planos.create({
        nome: newPlano.nome,
        tipoCobranca: newPlano.tipoCobranca,
        periodicidade: newPlano.periodicidade,
        valorBase: newPlano.tipoCobranca !== 'ESCALONADO_FROTA' ? Number(newPlano.valorBase) : 0,
        faixasPreco: faixasValidadas,
        fidelidadeMeses: Number(newPlano.fidelidadeMeses),
        descontoFidelidadePct: Number(newPlano.descontoFidelidadePct),
        descricao: newPlano.descricao
      });

      toast.success('Plano de cobrança cadastrado com sucesso!');
      setNewPlano({
        nome: '',
        tipoCobranca: 'POR_VEICULO',
        periodicidade: 'MENSAL',
        valorBase: '',
        fidelidadeMeses: '0',
        descontoFidelidadePct: '0',
        descricao: ''
      });
      setFaixasPreco([{ de: 1, ate: undefined, valor: 80 }]);
      setIsCriandoPlano(false);
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao cadastrar plano: ' + err.message);
    }
  };

  // Alterar Status do Plano (Ativo/Inativo)
  const handleTogglePlanoStatus = async (id: string, ativoAtual: boolean) => {
    try {
      await api.planos.update(id, { ativo: !ativoAtual });
      toast.success(`Plano ${ativoAtual ? 'desativado' : 'ativado'} com sucesso!`);
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao alterar status do plano: ' + err.message);
    }
  };

  // Cadastrar Equipamento
  const handleCadastrarEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipamento.identificador) return;
    try {
      await api.equipamentos.create({
        identificador: newEquipamento.identificador,
        iccid: newEquipamento.iccid || undefined,
        marca: newEquipamento.marca || undefined,
        modelo: newEquipamento.modelo || undefined,
        numeroLinha: newEquipamento.numeroLinha || undefined,
        operadora: newEquipamento.operadora || undefined,
        apn: newEquipamento.apn || undefined
      });
      toast.success('Equipamento cadastrado no estoque com sucesso!');
      setNewEquipamento({ identificador: '', iccid: '', marca: '', modelo: '', numeroLinha: '', operadora: '', apn: '', observacoes: '' });
      carregarDados();
      setCurrentPage('estoque');
    } catch (err: any) {
      toast.success('Erro ao cadastrar equipamento: ' + err.message);
    }
  };

  // Edições
  const handleEditClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCliente) return;
    try {
      await api.clientes.update(editCliente._id, {
        nome: editCliente.nome,
        documento: editCliente.documento,
        email: editCliente.email,
        whatsapp: editCliente.whatsapp,
        planoId: editCliente.planoId,
        diaVencimento: editCliente.diaVencimento
      });
      toast.success('Cliente atualizado com sucesso!');
      setEditCliente(null);
      carregarDados();
      if (selectedClientePanorama && selectedClientePanorama.cliente._id === editCliente._id) {
        handleAbrirFichaCliente(editCliente._id);
      }
    } catch (err: any) {
      toast.success('Erro ao editar cliente: ' + err.message);
    }
  };

  const handleDeleteVeiculo = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.')) return;
    try {
      await api.veiculos.delete(id);
      toast.success('Veículo excluído com sucesso!');
      carregarDados();
      if (selectedClientePanorama) {
        handleAbrirFichaCliente(selectedClientePanorama.cliente._id);
      }
    } catch (err: any) {
      toast.success('Erro ao excluir veículo: ' + err.message);
    }
  };

  const handleDeleteEquipamento = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) return;
    try {
      await api.equipamentos.delete(id);
      toast.success('Equipamento excluído com sucesso!');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao excluir equipamento: ' + err.message);
    }
  };


  const handleEditVeiculoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVeiculo) return;
    try {
      await api.veiculos.update(editVeiculo._id, {
        placa: editVeiculo.placa,
        marca: editVeiculo.marca,
        modelo: editVeiculo.modelo,
        cor: editVeiculo.cor,
        ano: editVeiculo.ano,
        rastreadorId: editVeiculo.rastreadorId
      });
      toast.success('Veículo atualizado com sucesso!');
      setEditVeiculo(null);
      carregarDados();
      if (selectedClientePanorama) {
        handleAbrirFichaCliente(selectedClientePanorama.cliente._id);
      }
    } catch (err: any) {
      toast.success('Erro ao editar veículo: ' + err.message);
    }
  };

  const handleEditEquipamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEquipamento) return;
    try {
      await api.equipamentos.update(editEquipamento._id, {
        identificador: editEquipamento.identificador,
        iccid: editEquipamento.iccid,
        numeroLinha: editEquipamento.numeroLinha,
        operadora: editEquipamento.operadora,
        marca: editEquipamento.marca,
        modelo: editEquipamento.modelo,
        apn: editEquipamento.apn
      });
      toast.success('Equipamento atualizado com sucesso!');
      setEditEquipamento(null);
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao editar equipamento: ' + err.message);
    }
  };

  // Transferir Equipamento para Técnico
  const handleTransferirEquipamento = async (equipamentoId: string) => {
    if (!tecnicoParaTransferencia) {
      toast.error('Ocorreu um erro');
      return;
    }
    try {
      await api.equipamentos.transfer(equipamentoId, tecnicoParaTransferencia);
      toast.success('Equipamento transferido para o técnico com sucesso!');
      setTransferindoId(null);
      setTecnicoParaTransferencia('');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao transferir equipamento: ' + err.message);
    }
  };

  // Devolver Equipamento ao Estoque
  const handleDevolverAoEstoque = async (equipamentoId: string) => {
    if (!window.confirm('Confirma devolução ao estoque central?')) return;
    try {
      await api.equipamentos.transfer(equipamentoId, null);
      toast.success('Equipamento devolvido ao estoque central!');
      carregarDados();
    } catch (err: any) {
      toast.success('Erro ao devolver equipamento: ' + err.message);
    }
  };


  // Busca do Histórico Cruzado (Simulado)
  const handleBuscarHistorico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaHistorico) return;

    if (historicoTipo === 'veiculo') {
      const query = buscaHistorico.toUpperCase();
      if (query === 'KRT-5H21' || query === 'KRT5H21') {
        setHistoricoResult([
          'Instalado em 23/06/2026 pelo Técnico Felipe Santana: Rastreador IMEI 358293029384931 & Chip ICCID 8955102003948576302'
        ]);
      } else {
        setHistoricoResult([
          'Instalado em 12/03/2025 pelo Técnico Roberto Alves: Rastreador IMEI 358293029384729 & Chip ICCID 8955102003948576201 (Ativo)',
          'Instalado em 10/01/2024 pelo Técnico Roberto Alves: Rastreador IMEI 358293029384812 & Chip ICCID 8955102003948576409 (Desinstalado em 12/03/2025)'
        ]);
      }
    } else {
      setHistoricoResult([
        'Instalado no Veículo Placa ABC-1234 em 10/01/2024 (Desinstalado em 12/03/2025)',
        'Instalado no Veículo Placa XYZ-9876 em 12/03/2025 (Ativo atualmente)'
      ]);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const num = parseInt(id) || 1;
    if (num % 3 === 0) return 'red';
    if (num % 3 === 1) return 'blue';
    return 'purple';
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Header Mobile de Topo */}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu">
          ☰
        </button>
        <div className="mobile-logo-text">
          <h3>AP RASTRO</h3>
        </div>
        <div className="mobile-avatar">{getInitials(userName)}</div>
      </header>

      {/* Overlay da Sidebar Mobile */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar de Navegação */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userRole={userRole}
        selectedOSId={selectedOSId}
        isOpen={isMobileMenuOpen}
        isDesktopExpanded={isDesktopSidebarExpanded}
        onClose={() => setIsMobileMenuOpen(false)}
        
      />

      {/* Visualização de Conteúdo Principal */}
      <main className={`main-content ${isDesktopSidebarExpanded ? 'expanded' : ''}`}>
        <Topbar 
          userName={userName} 
          onLogout={handleLogout} 
          clientes={clientes} 
          ordens={ordens} 
          handleAbrirFichaCliente={handleAbrirFichaCliente} 
          setCurrentPage={setCurrentPage} 
          toggleSidebar={() => { if(window.innerWidth > 992) { setIsDesktopSidebarExpanded(!isDesktopSidebarExpanded); } else { setIsMobileMenuOpen(!isMobileMenuOpen); } }} 
        />

        {/* --- PÁGINA: DASHBOARD ADMIN --- */}
        {currentPage === 'dashboard' && (
          <Dashboard 
            totalReceitaEstimada={totalReceitaEstimada}
            totalVeiculosMonitorados={totalVeiculosMonitorados}
            lucroReal={lucroReal}
            totalDespesas={totalDespesas}
            fluxoAbril={fluxoAbril}
            fluxoMaio={fluxoMaio}
            fluxoJunho={fluxoJunho}
            maxVal={maxVal}
            offsetAtrasadas={offsetAtrasadas}
            offsetPendentes={offsetPendentes}
            offsetPagas={offsetPagas}
            valorFaturasPagas={valorFaturasPagas}
            valorFaturasPendentes={valorFaturasPendentes}
            valorFaturasAtrasadas={valorFaturasAtrasadas}
            faturasPagasCount={faturasPagasCount}
            faturasPendentesCount={faturasPendentesCount}
            faturasAtrasadasCount={faturasAtrasadasCount}
            clientes={clientes}
            mrrPerdido={mrrPerdido}
            taxaChurn={taxaChurn}
            paretoData={paretoData}
            handleAbrirFichaCliente={handleAbrirFichaCliente}
            getAvatarColor={getAvatarColor}
            getInitials={getInitials}
          />
        )}

        {/* --- PÁGINA: LISTAGEM DE CLIENTES (Tela Inteira) --- */}
        {currentPage === 'clientes' && (
          <div>
            <div className="view-header">
              <h1>Clientes e Frotas</h1>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={gerarRelatorioChurn}>
                  📄 Relatório de Cancelamentos
                </button>
                <button className="btn btn-primary" onClick={() => setCurrentPage('clientes-cadastro')}>
                  + Cadastrar Cliente
                </button>
              </div>
            </div>

            <div className="table-box">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{mostrarInativos ? 'Frotas Inativas (Desligadas)' : 'Frotas Ativas'}</h3>
                  <div className="filter-tabs">
                    <button 
                      className={`btn ${!mostrarInativos ? 'btn-primary' : 'btn-secondary'}`} 
                      onClick={() => mostrarInativos && handleToggleInativos()}
                      style={{ padding: '0.4rem 1rem', borderRadius: '4px 0 0 4px', borderRight: 'none' }}
                    >
                      Ativos ({clientes.length})
                    </button>
                    <button 
                      className={`btn ${mostrarInativos ? 'btn-primary' : 'btn-secondary'}`} 
                      onClick={() => !mostrarInativos && handleToggleInativos()}
                      style={{ padding: '0.4rem 1rem', borderRadius: '0 4px 4px 0' }}
                    >
                      Inativos
                    </button>
                  </div>
                </div>
                
                {/* BARRA DE BUSCA */}
                <div style={{ display: 'flex' }}>
                  <input 
                    type="text" 
                    placeholder="Busque por nome do cliente, documento ou email..." 
                    className="input" 
                    style={{ width: '100%', maxWidth: '400px' }}
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>WhatsApp</th>
                      <th>Plano</th>
                      <th>Qtd. Veículos</th>
                      <th>Dia Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mostrarInativos ? clientesInativos : clientes)
                      .filter(c => !buscaCliente || 
                        c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) || 
                        c.documento.toLowerCase().includes(buscaCliente.toLowerCase()) || 
                        (c.email && c.email.toLowerCase().includes(buscaCliente.toLowerCase()))
                      )
                      .map(c => (
                      <tr key={c._id}>
                        <td>
                          <div className="customer-cell" style={{ cursor: 'pointer' }} onClick={() => handleAbrirFichaCliente(c._id)}>
                            <div className={`customer-avatar ${getAvatarColor(c._id)}`}>
                              {getInitials(c.nome)}
                            </div>
                            <div className="customer-info">
                              <span style={{ color: 'var(--primary-hover)', textDecoration: 'underline' }}>{c.nome}</span>
                              <small>{c.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{c.documento}</td>
                        <td>{c.whatsapp || 'N/A'}</td>
                        <td>
                          <span className="badge badge-info" style={{ background: 'var(--bg-deep)' }}>
                            {(c.planoId as any)?.nome || 'Padrão'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info">{(c.veiculosCount || 0)} veículos</span>
                        </td>
                        <td>Dia {c.diaVencimento || 10}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PÁGINA: FORMULÁRIO DE CADASTRO DE CLIENTE (Dedicada) --- */}
        {currentPage === 'clientes-cadastro' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Cadastrar Novo Cliente</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('clientes')}>
                Voltar
              </button>
            </div>

            <div className="card">
              <form onSubmit={handleAddCliente} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Nome Completo / Razão Social</label>
                  <input
                    type="text"
                    placeholder="Ex: Transportadora Rastro"
                    value={newCliente.nome}
                    onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="Ex: 00.000.000/0001-00"
                    value={newCliente.documento}
                    onChange={(e) => setNewCliente({ ...newCliente, documento: maskCpfCnpj(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    placeholder="Ex: financeiro@email.com"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp / Celular</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-9999"
                    value={newCliente.whatsapp}
                    onChange={(e) => setNewCliente({ ...newCliente, whatsapp: maskTelefone(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Plano de Cobrança</label>
                  <select
                    value={newCliente.planoId}
                    onChange={(e) => setNewCliente({ ...newCliente, planoId: e.target.value })}
                  >
                    <option value="">Padrão (R$ 80,00 por veículo)</option>
                    {planos.filter(p => p.ativo).map(p => (
                      <option key={p._id} value={p._id}>
                        {p.nome} ({p.tipoCobranca === 'POR_VEICULO' ? `R$ ${p.valorBase.toFixed(2)}/veíc.` : p.tipoCobranca === 'FIXO_GLOBAL' ? `R$ ${p.valorBase.toFixed(2)} Fixo` : 'Escalonado Frota'}) - {p.periodicidade}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Dia de Vencimento da Fatura</label>
                  <select
                    value={newCliente.diaVencimento}
                    onChange={(e) => setNewCliente({ ...newCliente, diaVencimento: Number(e.target.value) })}
                    required
                  >
                    <option value={5}>Dia 5</option>
                    <option value={10}>Dia 10 (Padrão)</option>
                    <option value={15}>Dia 15</option>
                    <option value={20}>Dia 20</option>
                    <option value={25}>Dia 25</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('clientes')}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Salvar Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* --- PÁGINA: FICHA DO CLIENTE (Panorama Consolidado) --- */}
        {currentPage === 'clientes-ficha' && selectedClientePanorama && (
          <div className="section-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1>Ficha do Cliente - {selectedClientePanorama.cliente.nome}</h1>
                <button 
                  className="btn btn-secondary" 
                  style={{ borderRadius: '50%', width: '35px', height: '35px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Ajuda e Atalhos"
                  onClick={() => setShowHelpModal(true)}
                >
                  ❓
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setEditCliente(selectedClientePanorama.cliente)}
                >
                  ✎ Editar Cliente
                </button>
                <button 
                  className="btn" 
                  style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} 
                  onClick={() => handleInativarCliente(selectedClientePanorama.cliente._id)}
                >
                  Inativar Cliente
                </button>
                <button className="btn btn-secondary" onClick={() => setCurrentPage('clientes')}>
                  Voltar
                </button>
              </div>
            </div>

            {/* Cabeçalho da Ficha com Informações Cadastrais */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="os-card-col">
                <span>Nome / Razão Social</span>
                <strong>{selectedClientePanorama.cliente.nome}</strong>
              </div>
              <div className="os-card-col">
                <span>CPF ou CNPJ</span>
                <strong>{selectedClientePanorama.cliente.documento}</strong>
              </div>
              <div className="os-card-col">
                <span>WhatsApp / Contato</span>
                {selectedClientePanorama.cliente.whatsapp ? (
                  <a 
                    href={`https://wa.me/55${selectedClientePanorama.cliente.whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: 'var(--success)', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    💬 {selectedClientePanorama.cliente.whatsapp}
                  </a>
                ) : (
                  <strong>N/A</strong>
                )}
              </div>
              <div className="os-card-col">
                <span>E-mail</span>
                <strong>{selectedClientePanorama.cliente.email || 'N/A'}</strong>
              </div>
              <div className="os-card-col">
                <span>Plano Contratado</span>
                <strong>{selectedClientePanorama.cliente.planoId?.nome || 'Padrão (R$ 80,00/veíc.)'}</strong>
              </div>
              <div className="os-card-col">
                <span>Vencimento Mensal</span>
                <strong>Dia {selectedClientePanorama.cliente.diaVencimento || 10}</strong>
              </div>
              <div className="os-card-col">
                <span>Status</span>
                <strong style={{ color: selectedClientePanorama.cliente.ativo ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedClientePanorama.cliente.ativo ? 'Ativo' : 'Inativo'}
                </strong>
              </div>
              {!selectedClientePanorama.cliente.ativo && (
                <>
                  <div className="os-card-col">
                    <span>Categoria Cancelamento</span>
                    <strong style={{ color: 'var(--danger)' }}>{selectedClientePanorama.cliente.motivoInativacao || 'N/A'}</strong>
                  </div>
                  <div className="os-card-col">
                    <span>Observações (Detalhes)</span>
                    <strong>{selectedClientePanorama.cliente.detalhesInativacao || 'Nenhum detalhe informado'}</strong>
                  </div>
                  <div className="os-card-col">
                    <span>Operador do Cancelamento</span>
                    <strong>{selectedClientePanorama.cliente.operadorCancelamento || 'N/A'}</strong>
                  </div>
                </>
              )}
              <div className="os-card-col" style={{ gridColumn: 'span 2' }}>
                <span>Endereço Completo</span>
                <strong>
                  {selectedClientePanorama.cliente.endereco
                    ? `${selectedClientePanorama.cliente.endereco.rua || ''}, ${selectedClientePanorama.cliente.endereco.numero || ''} - ${selectedClientePanorama.cliente.endereco.cidade || ''}/${selectedClientePanorama.cliente.endereco.estado || ''}`
                    : 'Não informado'}
                </strong>
              </div>
            </div>

            {/* Menu de Abas Internas da Ficha do Cliente */}
            <div className="filter-bar" style={{ gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem', marginBottom: '1.5rem', display: 'flex' }}>
              <button 
                className={`btn ${fichaTab === 'veiculos' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setFichaTab('veiculos')}
              >
                🚗 Frota de Veículos ({selectedClientePanorama.veiculos.length})
              </button>
              <button 
                className={`btn ${fichaTab === 'historico' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setFichaTab('historico')}
              >
                📜 Histórico de Auditoria ({selectedClientePanorama.historico.length})
              </button>
              <button 
                className={`btn ${fichaTab === 'financeiro' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setFichaTab('financeiro')}
              >
                💰 Faturas / Faturamento ({selectedClientePanorama.faturas.length})
              </button>
            </div>

            {/* CONTEÚDO DA ABA: VEÍCULOS (FROTA) */}
            {fichaTab === 'veiculos' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#555', margin: 0 }}>🚗 Gerencie a frota ativa deste cliente.</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setIsAddingFrota(!isAddingFrota)}
                    >
                      {isAddingFrota ? 'Cancelar Cadastro' : '+ Cadastro Rápido (Frota)'}
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        setNewOS({ ...newOS, clienteId: selectedClientePanorama.cliente._id });
                        setCurrentPage('ordens');
                      }}
                    >
                      + Nova Instalação (O.S.)
                    </button>
                  </div>
                </div>

                {isAddingFrota && (
                  <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)', backgroundColor: 'rgba(255, 60, 60, 0.05)' }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Cadastro Rápido de Frota em Lote</h3>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                      Preencha os dados dos veículos abaixo. Ao salvar, os veículos serão criados e atrelados a este cliente. 
                      Se um IMEI for informado, o equipamento será ativado automaticamente sem passar pelo processo de Ordem de Serviço.
                    </p>
                    <div className="table-container">
                      <table style={{ width: '100%', marginBottom: '1rem' }}>
                        <thead>
                          <tr>
                            <th>Placa *</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Cor</th>
                            <th>Ano</th>
                            <th>IMEI (Rastreador)</th>
                            <th>ICCID (Chip)</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {frotaRows.map((row, index) => (
                            <tr key={index}>
                              <td>
                                <input type="text" className="input" placeholder="ABC-1234" value={row.placa} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].placa = mascaraPlaca(e.target.value);
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <input type="text" className="input" placeholder="Chevrolet" value={row.marca} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].marca = e.target.value;
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <input type="text" className="input" placeholder="Onix" value={row.modelo} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].modelo = e.target.value;
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <input type="text" className="input" placeholder="Branco" value={row.cor} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].cor = e.target.value;
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <input type="text" className="input" placeholder="2021" value={row.ano} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].ano = e.target.value;
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <input type="text" className="input" placeholder="IMEI 15 dígitos" value={row.imei} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].imei = e.target.value;
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <input type="text" className="input" placeholder="ICCID 20 dígitos" value={row.iccid} onChange={(e) => {
                                  const newRows = [...frotaRows];
                                  newRows[index].iccid = e.target.value;
                                  setFrotaRows(newRows);
                                }} />
                              </td>
                              <td>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                                  const newRows = frotaRows.filter((_, i) => i !== index);
                                  setFrotaRows(newRows.length ? newRows : [{ placa: '', marca: '', modelo: '', cor: '', ano: '', imei: '', iccid: '' }]);
                                }}>🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button className="btn btn-secondary" onClick={() => setFrotaRows([...frotaRows, { placa: '', marca: '', modelo: '', cor: '', ano: '', imei: '', iccid: '' }])}>
                        + Adicionar Linha
                      </button>
                      <button className="btn btn-primary" onClick={handleSalvarFrota}>
                        Salvar Frota ({frotaRows.filter(r => r.placa).length} veículos)
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="table-box">
                  <h3>Veículos Cadastrados</h3>
                  <div className="table-container" style={{ marginTop: '1rem' }}>
                    {selectedClientePanorama.veiculos.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum veículo registrado na frota.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Placa</th>
                            <th>Marca / Modelo</th>
                            <th>Cor / Ano</th>
                            <th>Rastreador Instalado (IMEI)</th>
                            <th>Chip M2M (ICCID)</th>
                            <th>Status da Instalação</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClientePanorama.veiculos.map((v: any) => {
                            const instalacaoAtiva = selectedClientePanorama.historico.find((h: any) => 
                              (typeof h.veiculoId === 'string' ? h.veiculoId === v._id : h.veiculoId?._id === v._id) && 
                              !h.dataDesinstalacao
                            );

                            return (
                              <tr key={v._id}>
                                <td><strong>{v.placa}</strong></td>
                                <td>{v.marca || 'N/A'} - {v.modelo || 'N/A'}</td>
                                <td>{v.cor || 'N/A'} / {v.ano || 'N/A'}</td>
                                <td>{instalacaoAtiva?.rastreadorId?.identificador || 'N/A'}</td>
                                <td>{instalacaoAtiva?.rastreadorId?.iccid || 'N/A'}</td>
                                <td>
                                  <span className={`status-badge ${instalacaoAtiva ? 'active' : 'inactive'}`}>
                                    {instalacaoAtiva ? 'INSTALADO & ATIVO' : 'SEM DISPOSITIVO'}
                                  </span>
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => setEditVeiculo({...v, rastreadorId: instalacaoAtiva?.rastreadorId?._id || ''})}
                                  >
                                    ✎ Editar
                                  </button>
                                  <button 
                                    className="btn" 
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'var(--danger)', color: '#fff', border: 'none' }}
                                    onClick={() => handleDeleteVeiculo(v._id)}
                                  >
                                    🗑️ Excluir
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* CONTEÚDO DA ABA: HISTÓRICO DE AUDITORIA */}
            {fichaTab === 'historico' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#555', margin: 0 }}>📜 Acompanhe todas as movimentações de equipamentos deste cliente.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setNewOS({ ...newOS, clienteId: selectedClientePanorama.cliente._id });
                      setCurrentPage('ordens');
                    }}
                  >
                    + Registrar Manutenção/OS
                  </button>
                </div>
                <div className="card">
                  <h3>Linha do Tempo de Rastreabilidade</h3>
                  <div style={{ marginTop: '1rem' }}>
                    {selectedClientePanorama.historico.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum histórico de movimentação encontrado.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedClientePanorama.historico.map((h: any) => (
                          <li key={h._id} className="card" style={{ background: 'var(--bg-deep)', borderLeft: '4px solid var(--primary)', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <strong>Instalação Homologada</strong>
                              <small style={{ color: 'var(--text-muted)' }}>{new Date(h.dataInstalacao).toLocaleDateString('pt-BR')}</small>
                            </div>
                            <p style={{ fontSize: '0.85rem', margin: '0.15rem 0' }}>
                              Veículo: <strong>{h.veiculoId?.placa || 'N/A'}</strong>
                            </p>
                            <p style={{ fontSize: '0.85rem', margin: '0.15rem 0' }}>
                              Técnico Responsável: <strong>{h.tecnicoId?.nome || 'N/A'}</strong>
                            </p>
                            <p style={{ fontSize: '0.85rem', margin: '0.15rem 0' }}>
                              Rastreador IMEI: <strong>{h.rastreadorId?.identificador} ({h.rastreadorId?.marca} {h.rastreadorId?.modelo})</strong>
                            </p>
                            {h.observacao && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                Nota: {h.observacao}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* CONTEÚDO DA ABA: FINANCEIRO (MENSALIDADES) */}
            {fichaTab === 'financeiro' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#555', margin: 0 }}>💰 Acompanhe o status financeiro de faturas e faturas.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setFiltroFaturaCliente(selectedClientePanorama.cliente.nome);
                      setFinanceiroTab('faturas');
                      setCurrentPage('financeiro');
                    }}
                  >
                    + Gerenciar Faturas
                  </button>
                </div>
                <div className="table-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Faturas do Cliente (Histórico Financeiro)</h3>
                    {selectedFaturasIds.length > 0 && (
                      <button 
                        className="btn" 
                        style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                        onClick={handleBulkDeleteFaturas}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Apagando...' : `🗑️ Apagar Selecionadas (${selectedFaturasIds.length})`}
                      </button>
                    )}
                  </div>
                  <div className="table-container" style={{ marginTop: '1rem' }}>
                    {selectedClientePanorama.faturas.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma fatura gerada para este cliente.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>
                            <input 
                              type="checkbox" 
                              checked={selectedFaturasIds.length === selectedClientePanorama.faturas.length && selectedClientePanorama.faturas.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFaturasIds(selectedClientePanorama.faturas.map((m: any) => m._id));
                                } else {
                                  setSelectedFaturasIds([]);
                                }
                              }}
                            />
                          </th>
                          <th>Valor</th>
                          <th>Emissão</th>
                          <th>Vencimento</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientePanorama.faturas.map((m: any) => (
                          <tr key={m._id}>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={selectedFaturasIds.includes(m._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFaturasIds([...selectedFaturasIds, m._id]);
                                  } else {
                                    setSelectedFaturasIds(selectedFaturasIds.filter(id => id !== m._id));
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <strong>R$ {((m.status === 'PAGO' || m.status === 'PARCIAL') && m.valorPago != null ? m.valorPago : m.valor).toFixed(2)}</strong>
                              {(m.status === 'PAGO' || m.status === 'PARCIAL') && (m.desconto || 0) > 0 && <div style={{fontSize: '0.75rem', color: 'var(--success)'}}>- R$ {Number(m.desconto).toFixed(2)} (desc)</div>}
                              {(m.status === 'PAGO' || m.status === 'PARCIAL') && (m.acrescimo || 0) > 0 && <div style={{fontSize: '0.75rem', color: 'var(--danger)'}}>+ R$ {Number(m.acrescimo).toFixed(2)} (juros)</div>}
                            </td>
                            <td>{new Date(m.dataEmissao).toLocaleDateString('pt-BR')}</td>
                            <td>{new Date(m.dataVencimento).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <span className={`status-badge ${
                                m.status === 'PAGO' ? 'active' :
                                m.status === 'PENDENTE' ? 'pending' : 'inactive'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                            <td>
                              {m.status !== 'PAGO' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                  onClick={() => handleOpenCheckout(m)}
                                >
                                  💳 Pagar / Checkout
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              </>
            )}

            {/* MODAL DE AJUDA DA FICHA */}
            {showHelpModal && (
              <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '500px' }}>
                  <div className="modal-header">
                    <h3>Ajuda e Atalhos - Ficha do Cliente</h3>
                    <button className="close-btn" onClick={() => setShowHelpModal(false)}>✕</button>
                  </div>
                  <div className="modal-body" style={{ lineHeight: '1.6' }}>
                    <p>Bem-vindo à ficha completa do cliente! Veja algumas orientações para facilitar seu trabalho:</p>
                    <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                      <li style={{ marginBottom: '10px' }}>
                        <strong>Aba Veículos:</strong> Ao clicar no botão `+ Nova Instalação`, o sistema leva você direto para a abertura de O.S. já com este cliente selecionado!
                      </li>
                      <li style={{ marginBottom: '10px' }}>
                        <strong>Aba Histórico:</strong> Tudo que acontecer com este cliente (instalação, manutenção e desinstalação) ficará salvo automaticamente aqui.
                      </li>
                      <li style={{ marginBottom: '10px' }}>
                        <strong>Aba Financeiro:</strong> Exibe todas as faturas atreladas aos veículos deste cliente. Clique no botão de gerenciar para ir à área financeira.
                      </li>
                    </ul>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }} onClick={() => setShowHelpModal(false)}>
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* --- PÁGINA: LISTAGEM DE TÉCNICOS --- */}
        {currentPage === 'tecnicos' && (
          <div>
            <div className="view-header">
              <h1>Técnicos (Instaladores)</h1>
              <button className="btn btn-primary" onClick={() => setCurrentPage('tecnicos-cadastro')}>
                + Cadastrar Técnico
              </button>
            </div>

            <div className="table-box">
              <h3>Técnicos Ativos</h3>
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Técnico</th>
                      <th>Contato</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tecnicos.map(t => (
                      <tr key={t._id}>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar red">
                              {getInitials(t.nome)}
                            </div>
                            <div className="customer-info">
                              <span>{t.nome}</span>
                              <small>Instalador Oficial</small>
                            </div>
                          </div>
                        </td>
                        <td>{t.telefone}</td>
                        <td>
                          <span className={`status-badge ${t.ativo ? 'active' : 'inactive'}`}>
                            {t.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PÁGINA: FORMULÁRIO DE CADASTRO DE TÉCNICO --- */}
        {currentPage === 'tecnicos-cadastro' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Cadastrar Novo Técnico</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('tecnicos')}>
                Voltar
              </button>
            </div>

            <div className="card">
              <form onSubmit={handleAddTecnico} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Nome do Instalador</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={newTecnico.nome}
                    onChange={(e) => setNewTecnico({ ...newTecnico, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefone de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98888-8888"
                    value={newTecnico.telefone}
                    onChange={(e) => setNewTecnico({ ...newTecnico, telefone: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('tecnicos')}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Cadastrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- PÁGINA: ESTOQUE (REFORMULADA) --- */}
        {currentPage === 'estoque' && (
          <div>
            <div className="view-header">
              <h1>Estoque de Equipamentos</h1>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setCurrentPage('estoque-cadastro-equipamento')}>
                  + Cadastrar Equipamento / Chip
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Tipo:</label>
                  <select value={filtroEstoqueTipo} onChange={e => setFiltroEstoqueTipo(e.target.value)} style={{ flex: 1 }}>
                    <option value="todos">Todos</option>
                    <option value="RASTREADOR">Rastreadores</option>
                    <option value="CHIP">Chips</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Status:</label>
                  <select value={filtroEstoqueStatus} onChange={e => setFiltroEstoqueStatus(e.target.value)} style={{ flex: 1 }}>
                    {filtroEstoqueStatus === 'todos' && <option value="todos">Todos os Equipamentos</option>}
                    <option value="ESTOQUE">Em Estoque</option>
                    <option value="COM_TECNICO">Com Técnico</option>
                    <option value="INSTALADO">Instalado</option>
                    <option value="DEFEITUOSO">Defeituoso</option>
                  </select>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {equipamentos.filter(eq =>
                    (filtroEstoqueStatus === 'todos' || eq.status === filtroEstoqueStatus) &&
                    (!buscaEstoque || 
                      eq.identificador?.toLowerCase().includes(buscaEstoque.toLowerCase()) || 
                      eq.iccid?.toLowerCase().includes(buscaEstoque.toLowerCase()) || 
                      eq.numeroLinha?.toLowerCase().includes(buscaEstoque.toLowerCase())
                    )
                  ).length} equipamento(s)
                </div>
              </div>
              
              <div style={{ display: 'flex' }}>
                <input 
                  type="text" 
                  placeholder="Busque por IMEI, ICCID ou Linha..." 
                  className="input" 
                  style={{ width: '100%', maxWidth: '400px' }}
                  value={buscaEstoque}
                  onChange={(e) => setBuscaEstoque(e.target.value)}
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="table-box">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>IMEI (Rastreador)</th>
                      <th>ICCID (Chip)</th>
                      <th>Operadora / Linha</th>
                      <th>Marca / Modelo</th>
                      <th>Status</th>
                      <th>Posse / Resp.</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipamentos
                      .filter(eq =>
                        (filtroEstoqueStatus === 'todos' || eq.status === filtroEstoqueStatus) &&
                        (!buscaEstoque || 
                          eq.identificador?.toLowerCase().includes(buscaEstoque.toLowerCase()) || 
                          eq.iccid?.toLowerCase().includes(buscaEstoque.toLowerCase()) || 
                          eq.numeroLinha?.toLowerCase().includes(buscaEstoque.toLowerCase())
                        )
                      )
                      .map(eq => (
                        <React.Fragment key={eq._id}>
                          <tr>
                            <td>
                              <span className="badge badge-info">
                                📡 RASTREADOR
                              </span>
                            </td>
                            <td><strong style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{eq.identificador}</strong></td>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {eq.iccid || '—'}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {eq.operadora || '—'} {eq.numeroLinha ? `(${eq.numeroLinha})` : ''}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {eq.marca || '—'} {eq.modelo ? `/ ${eq.modelo}` : ''}
                            </td>
                            <td>
                              <span className={`status-badge ${
                                eq.status === 'INSTALADO' ? 'active' :
                                eq.status === 'COM_TECNICO' ? 'pending' :
                                eq.status === 'DEFEITUOSO' ? 'inactive' : ''
                              }`}>
                                {eq.status === 'ESTOQUE' ? 'EM ESTOQUE' :
                                 eq.status === 'COM_TECNICO' ? 'COM TÉCNICO' :
                                 eq.status === 'INSTALADO' ? 'INSTALADO' :
                                 eq.status === 'DEFEITUOSO' ? 'DEFEITUOSO' : eq.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {(eq.tecnicoResponsavelId as any)?.nome || 'Estoque Central'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {eq.status === 'ESTOQUE' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => {
                                      const isTransfering = transferindoId === eq._id;
                                      setTransferindoId(isTransfering ? null : eq._id);
                                      setTecnicoParaTransferencia('');
                                    }}
                                  >
                                    {transferindoId === eq._id ? '✕ Cancelar' : '↗ Transferir'}
                                  </button>
                                )}
                                {eq.status === 'COM_TECNICO' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => handleDevolverAoEstoque(eq._id)}
                                  >
                                    ↩ Devolver
                                  </button>
                                )}
                                {eq.status === 'INSTALADO' && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Em uso</span>
                                )}
                                {eq.status === 'DEFEITUOSO' && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic' }}>Defeituoso</span>
                                )}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                  onClick={() => setEditEquipamento(eq)}
                                >
                                  ✎ Editar
                                </button>
                                <button
                                  className="btn"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'var(--danger)', color: '#fff', border: 'none' }}
                                  onClick={() => handleDeleteEquipamento(eq._id)}
                                >
                                  🗑️ Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Linha de transferência expandida */}
                          {transferindoId === eq._id && (
                            <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                                <td colSpan={8} style={{ padding: '0.75rem 1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transferir para:</span>
                                  <select
                                    value={tecnicoParaTransferencia}
                                    onChange={e => setTecnicoParaTransferencia(e.target.value)}
                                    style={{ minWidth: '200px' }}
                                  >
                                    <option value="">Selecione o técnico...</option>
                                    {tecnicos.filter(t => t.ativo).map(t => (
                                      <option key={t._id} value={t._id}>{t.nome}</option>
                                    ))}
                                  </select>
                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                    onClick={() => handleTransferirEquipamento(eq._id)}
                                  >
                                    ✓ Confirmar Transferência
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                    onClick={() => setTransferindoId(null)}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    }
                    {equipamentos.filter(eq =>
                      (filtroEstoqueStatus === 'todos' || eq.status === filtroEstoqueStatus)
                    ).length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          Nenhum equipamento encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  <p style={{ margin: 0 }}><strong>{equipamentos.length}</strong> Total</p>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📡 Rastreadores</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                  <p style={{ margin: 0 }}><strong>{equipamentos.filter(e => !!e.iccid).length}</strong> Em Linhas</p>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📶 Chips</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                  {equipamentos.filter(e => e.status === 'INSTALADO').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>✅ Instalados</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>
                  {equipamentos.filter(e => e.status === 'ESTOQUE').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📦 Em Estoque</div>
              </div>
            </div>
          </div>
        )}

        {/* --- PÁGINA: CADASTRAR EQUIPAMENTO UNIFICADO --- */}
        {currentPage === 'estoque-cadastro-equipamento' && (
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Cadastrar Equipamento</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('estoque')}>Voltar</button>
            </div>
            <div className="card">
              <form onSubmit={handleCadastrarEquipamento} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>IMEI do Rastreador <span style={{ color: 'var(--primary)' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="Ex: 358293029384931"
                      value={newEquipamento.identificador}
                      onChange={e => setNewEquipamento({ ...newEquipamento, identificador: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ICCID do Chip (Embutido)</label>
                    <input
                      type="text"
                      placeholder="Ex: 8955102003948576302"
                      value={newEquipamento.iccid}
                      onChange={e => setNewEquipamento({ ...newEquipamento, iccid: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Marca (GPS)</label>
                    <input type="text" placeholder="Ex: Teltonika" value={newEquipamento.marca} onChange={e => setNewEquipamento({ ...newEquipamento, marca: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Modelo (GPS)</label>
                    <input type="text" placeholder="Ex: FMB920" value={newEquipamento.modelo} onChange={e => setNewEquipamento({ ...newEquipamento, modelo: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Número da Linha</label>
                    <input type="text" placeholder="Ex: (21) 98765-4321" value={newEquipamento.numeroLinha} onChange={e => setNewEquipamento({ ...newEquipamento, numeroLinha: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Operadora</label>
                    <select value={newEquipamento.operadora} onChange={e => setNewEquipamento({ ...newEquipamento, operadora: e.target.value })}>
                      <option value="">Selecione...</option>
                      <option value="Claro">Claro</option>
                      <option value="Vivo">Vivo</option>
                      <option value="TIM">TIM</option>
                      <option value="Oi">Oi</option>
                      <option value="Algar">Algar</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>APN</label>
                    <input type="text" placeholder="Ex: zap.vivo.com.br" value={newEquipamento.apn} onChange={e => setNewEquipamento({ ...newEquipamento, apn: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Observações</label>
                  <textarea
                    placeholder="Informações adicionais..."
                    value={newEquipamento.observacoes}
                    onChange={e => setNewEquipamento({ ...newEquipamento, observacoes: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>📡 Cadastrar no Estoque</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('estoque')}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- PÁGINA: CAIXA DE ENTRADA O.S. (ADMIN) --- */}
        {currentPage === 'ordens' && (
          <div>
            <div className="view-header">
              <h1>Caixa de Entrada de Instalações (O.S.)</h1>
              <button className="btn btn-primary" onClick={() => setCurrentPage('ordens-cadastro')}>
                + Agendar Instalação
              </button>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Validações Pendentes</h3>
              <div style={{ marginTop: '1rem' }}>
                {ordens.filter(o => o.status === 'PENDENTE').length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma ordem de serviço pendente de validação.</p>
                ) : (
                  ordens.filter(o => o.status === 'PENDENTE').map(os => (
                    <div className="os-card" key={os._id}>
                      <div className="os-card-header">
                        <h3>O.S. - Solicitação de Instalação</h3>
                        <span className="status-badge pending">{os.status}</span>
                      </div>
                      <div className="os-card-grid">
                        <div className="os-card-col">
                          <span>Instalador</span>
                          <strong>{(os.tecnicoId as any)?.nome || 'N/A'}</strong>
                        </div>
                        <div className="os-card-col">
                          <span>Cliente</span>
                          <strong>{(os.veiculoId as any)?.clienteId?.nome || 'N/A'}</strong>
                        </div>
                        <div className="os-card-col">
                          <span>Placa</span>
                          <strong>{(os.veiculoId as any)?.placa || 'N/A'}</strong>
                        </div>
                        <div className="os-card-col">
                          <span>Rastreador</span>
                          <strong>{(os.rastreadorId as any)?.identificador || 'N/A'}</strong>
                        </div>
                      </div>
                      <div className="os-card-photos">
                        {os.fotosUrls && os.fotosUrls.length > 0 ? (
                          os.fotosUrls.map((url, i) => (
                            <a href={`http://localhost:5000${url}`} target="_blank" rel="noreferrer" key={i} className="os-photo-box" style={{ padding: 0, overflow: 'hidden', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={`http://localhost:5000${url}`} alt="Evidência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </a>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhuma foto anexada.</span>
                        )}
                      </div>
                      <div className="os-card-actions">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRejectOS(os._id)}>Rejeitar</button>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleApproveOS(os._id)}>Confirmar & Ativar</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <h3>Agendamentos em Campo (Aguardando Instalação)</h3>
              <div style={{ marginTop: '1rem' }}>
                {ordens.filter(o => o.status === 'AGENDADA' || o.status === 'REJEITADO').length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Nenhum serviço agendado pendente no campo.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {ordens.filter(o => o.status === 'AGENDADA' || o.status === 'REJEITADO').map(os => (
                      <div className="os-card" key={os._id} style={{ marginBottom: 0, borderLeft: os.status === 'REJEITADO' ? '4px solid var(--primary)' : '4px solid var(--accent-blue)' }}>
                        <div className="os-card-header" style={{ marginBottom: '0.5rem' }}>
                          <strong>Placa: {(os.veiculoId as any)?.placa || 'N/A'}</strong>
                          <span className={`status-badge ${os.status === 'REJEITADO' ? 'inactive' : 'pending'}`}>{os.status}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', margin: '0.2rem 0' }}>Técnico: <strong>{(os.tecnicoId as any)?.nome || 'N/A'}</strong></p>
                        <p style={{ fontSize: '0.82rem', margin: '0.2rem 0' }}>Cliente: <strong>{(os.veiculoId as any)?.clienteId?.nome || 'N/A'}</strong></p>
                        {os.status === 'REJEITADO' && os.motivoRejeicao && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem' }}>Motivo Devolução: {os.motivoRejeicao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PÁGINA: FORMULÁRIO DE AGENDAMENTO DE O.S. (ADMIN) --- */}
        {currentPage === 'ordens-cadastro' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Agendar Nova Instalação (O.S.)</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('ordens')}>
                Voltar
              </button>
            </div>

            <div className="card">
              <form onSubmit={handleScheduleOS} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Selecione o Cliente</label>
                  <select
                    value={scheduleOS.clienteId}
                    onChange={(e) => setScheduleOS({ ...scheduleOS, clienteId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(c => (
                      <option key={c._id} value={c._id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Placa do Veículo (Obrigatório)</label>
                  <input
                    type="text"
                    placeholder="Ex: ABC1D23"
                    value={scheduleOS.placa}
                    onChange={(e) => setScheduleOS({ ...scheduleOS, placa: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Técnico Responsável</label>
                  <select
                    value={scheduleOS.tecnicoId}
                    onChange={(e) => setScheduleOS({ ...scheduleOS, tecnicoId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {tecnicos.filter(t => t.ativo).map(t => (
                      <option key={t._id} value={t._id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Rastreador IMEI (Em Estoque ou com o Técnico)</label>
                  <select
                    value={scheduleOS.rastreadorId}
                    onChange={(e) => setScheduleOS({ ...scheduleOS, rastreadorId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {equipamentos
                      .filter(eq => (eq.status === 'ESTOQUE' || (eq.status === 'COM_TECNICO' && (typeof eq.tecnicoResponsavelId === 'string' ? eq.tecnicoResponsavelId === scheduleOS.tecnicoId : eq.tecnicoResponsavelId?._id === scheduleOS.tecnicoId))))
                      .map(eq => (
                        <option key={eq._id} value={eq._id}>
                          {eq.identificador} ({eq.modelo}) - {eq.status === 'ESTOQUE' ? 'Estoque Central' : 'Com Técnico'}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Instruções / Observações de Agendamento</label>
                  <textarea
                    placeholder="Instruções para o técnico..."
                    value={scheduleOS.observacoes}
                    onChange={(e) => setScheduleOS({ ...scheduleOS, observacoes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('ordens')}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Agendar Instalação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- PÁGINA: FINANCEIRO (MENSALIDADES E PLANOS) --- */}
        {currentPage === 'financeiro' && (
          <div>
            <div className="view-header">
              <h1>Gestão Financeira</h1>
              {financeiroTab === 'faturas' && (
                <button className="btn btn-primary" onClick={handleForcarFaturamento}>
                  ⚙️ Executar Ciclo de Faturamento
                </button>
              )}
            </div>

            {/* Menu de Abas Internas */}
            <div className="filter-bar" style={{ gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem', marginBottom: '1.5rem', display: 'flex' }}>
              <button 
                className={`btn ${financeiroTab === 'faturas' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setFinanceiroTab('faturas')}
              >
                Faturamento Recorrente
              </button>
              <button 
                className={`btn ${financeiroTab === 'planos' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setFinanceiroTab('planos');
                  setIsCriandoPlano(false);
                }}
              >
                Planos de Assinatura ({planos.length})
              </button>
            </div>

            {financeiroTab === 'faturas' ? (
              <div className="table-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3>Faturas Pendentes/Pagas</h3>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setIsFaturaModalOpen(true)}>
                      + Nova Fatura Avulsa
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', color: 'var(--text-light)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={agruparFinanceiro} 
                        onChange={(e) => setAgruparFinanceiro(e.target.checked)} 
                      />
                      Agrupar por Cliente
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Buscar por cliente..." 
                      value={filtroFaturaCliente}
                      onChange={(e) => setFiltroFaturaCliente(e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-deep)', color: 'var(--text-light)' }}
                    />
                    <select 
                      value={filtroFaturaStatus}
                      onChange={(e) => setFiltroFaturaStatus(e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-deep)', color: 'var(--text-light)' }}
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="PENDENTE">Pendentes</option>
                      <option value="PAGO">Pagos</option>
                      <option value="ATRASADO">Atrasados</option>
                    </select>
                    {(filtroFaturaCliente || filtroFaturaStatus !== 'todos') && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => {
                          setFiltroFaturaCliente('');
                          setFiltroFaturaStatus('todos');
                        }}
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>
                </div>
                {selectedFaturasGeraisIds.length > 0 && (
                  <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                      {selectedFaturasGeraisIds.length} fatura(s) selecionada(s)
                    </span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn btn-primary" onClick={handleBulkCheckout}>
                        Dar Baixa Selecionadas
                      </button>
                      <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={handleBulkDelete}>
                        Excluir Selecionadas
                      </button>
                    </div>
                  </div>
                )}
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Valor</th>
                        <th>Emissão</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredFaturas = faturas.filter(m => {
                          const clienteNome = (m.clienteId?.nome || '').toLowerCase();
                          const busca = filtroFaturaCliente.toLowerCase();
                          if (busca && !clienteNome.includes(busca)) return false;
                          if (filtroFaturaStatus !== 'todos' && m.status !== filtroFaturaStatus) return false;
                          return true;
                        });

                        if (!agruparFinanceiro) {
                          return filteredFaturas.map(m => (
                            <tr key={m._id}>
                              <td>
                                {m.status !== 'PAGO' && (
                                  <input type="checkbox" checked={selectedFaturasGeraisIds.includes(m._id)} onChange={(e) => {
                                    if (e.target.checked) setSelectedFaturasGeraisIds([...selectedFaturasGeraisIds, m._id]);
                                    else setSelectedFaturasGeraisIds(selectedFaturasGeraisIds.filter(id => id !== m._id));
                                  }} />
                                )}
                              </td>
                              <td>
                                <div className="customer-cell">
                                  <div className={`customer-avatar ${getAvatarColor(m.clienteId?._id || '1')}`}>
                                    {getInitials(m.clienteId?.nome || 'N/A')}
                                  </div>
                                  <div className="customer-info">
                                    <span>{m.clienteId?.nome || 'Cliente Removido'}</span>
                                    <small>{m.clienteId?.whatsapp || 'N/A'}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <strong>R$ {((m.status === 'PAGO' || m.status === 'PARCIAL') && m.valorPago != null ? m.valorPago : m.valor).toFixed(2)}</strong>
                                {(m.status === 'PAGO' || m.status === 'PARCIAL') && (m.desconto || 0) > 0 && <div style={{fontSize: '0.75rem', color: 'var(--success)'}}>- R$ {Number(m.desconto).toFixed(2)} (desc)</div>}
                                {(m.status === 'PAGO' || m.status === 'PARCIAL') && (m.acrescimo || 0) > 0 && <div style={{fontSize: '0.75rem', color: 'var(--danger)'}}>+ R$ {Number(m.acrescimo).toFixed(2)} (juros)</div>}
                              </td>
                              <td>{new Date(m.dataEmissao).toLocaleDateString('pt-BR')}</td>
                              <td>{new Date(m.dataVencimento).toLocaleDateString('pt-BR')}</td>
                              <td>
                                <span className={`status-badge ${
                                  m.status === 'PAGO' ? 'active' :
                                  m.status === 'PENDENTE' ? 'pending' : 'inactive'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {m.status !== 'PAGO' && (
                                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleOpenCheckout(m)}>
                                      💳 Pagar
                                    </button>
                                  )}
                                  <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditFatura(m)}>
                                    ✎ Editar
                                  </button>
                                  <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => handleDeleteFatura(m._id)}>
                                    🗑️ Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        } else {
                          const grouped = filteredFaturas.reduce((acc: any, curr: any) => {
                            const cId = curr.clienteId?._id || 'desconhecido';
                            if (!acc[cId]) acc[cId] = { cliente: curr.clienteId, faturas: [] };
                            acc[cId].faturas.push(curr);
                            return acc;
                          }, {});
                          return Object.values(grouped).map((group: any) => (
                            <React.Fragment key={group.cliente?._id || 'desc'}>
                              <tr style={{ background: 'var(--bg-deep)' }}>
                                <td colSpan={7} style={{ padding: '0.5rem 1rem' }}>
                                  <div className="customer-cell" style={{ margin: 0 }}>
                                    <div className={`customer-avatar ${getAvatarColor(group.cliente?._id || '1')}`}>
                                      {getInitials(group.cliente?.nome || 'N/A')}
                                    </div>
                                    <div className="customer-info">
                                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{group.cliente?.nome || 'Cliente Removido'}</span>
                                      <small>{group.cliente?.whatsapp || 'N/A'} - {group.faturas.length} fatura(s)</small>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {group.faturas.map((m: any) => (
                                <tr key={m._id} style={{ opacity: 0.95 }}>
                                  <td>
                                    {m.status !== 'PAGO' && (
                                      <input type="checkbox" checked={selectedFaturasGeraisIds.includes(m._id)} onChange={(e) => {
                                        if (e.target.checked) setSelectedFaturasGeraisIds([...selectedFaturasGeraisIds, m._id]);
                                        else setSelectedFaturasGeraisIds(selectedFaturasGeraisIds.filter(id => id !== m._id));
                                      }} />
                                    )}
                                  </td>
                                  <td></td>
                                  <td>
                                    <strong>R$ {((m.status === 'PAGO' || m.status === 'PARCIAL') && m.valorPago != null ? m.valorPago : m.valor).toFixed(2)}</strong>
                                  </td>
                                  <td>{new Date(m.dataEmissao).toLocaleDateString('pt-BR')}</td>
                                  <td>{new Date(m.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                  <td>
                                    <span className={`status-badge ${m.status === 'PAGO' ? 'active' : m.status === 'PENDENTE' ? 'pending' : 'inactive'}`}>
                                      {m.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      {m.status !== 'PAGO' && (
                                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleOpenCheckout(m)}>
                                          💳 Pagar
                                        </button>
                                      )}
                                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditFatura(m)}>
                                        ✎
                                      </button>
                                      <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => handleDeleteFatura(m._id)}>
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ));
                        }
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* --- SUB-ABA: PLANOS DE ASSINATURA --- */
              <div>
                {!isCriandoPlano ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: 0 }}>Planos Cadastrados</h3>
                      <button className="btn btn-primary" onClick={() => setIsCriandoPlano(true)}>
                        + Criar Novo Plano
                      </button>
                    </div>

                    <div className="table-box">
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Nome do Plano</th>
                              <th>Tipo de Cobrança</th>
                              <th>Periodicidade</th>
                              <th>Valor / Faixas</th>
                              <th>Fidelidade / Desc.</th>
                              <th>Status</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planos.map(p => (
                              <tr key={p._id}>
                                <td>
                                  <strong>{p.nome}</strong>
                                  {p.descricao && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{p.descricao}</div>}
                                </td>
                                <td>
                                  <span className="badge badge-info">
                                    {p.tipoCobranca === 'POR_VEICULO' ? 'Unitário por Veículo' : p.tipoCobranca === 'FIXO_GLOBAL' ? 'Fixo Global' : 'Escalonado Frota'}
                                  </span>
                                </td>
                                <td><strong>{p.periodicidade}</strong></td>
                                <td>
                                  {p.tipoCobranca === 'ESCALONADO_FROTA' ? (
                                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                      {p.faixasPreco.map((f, idx) => (
                                        <div key={idx}>
                                          {f.de} a {f.ate || '∞'} veículos: <strong>R$ {f.valor.toFixed(2)}/cada</strong>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <strong>R$ {p.valorBase.toFixed(2)}</strong>
                                  )}
                                </td>
                                <td>
                                  {p.fidelidadeMeses > 0 ? (
                                    <span>{p.fidelidadeMeses} meses ({p.descontoFidelidadePct}% desc.)</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem fidelidade</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`status-badge ${p.ativo ? 'active' : 'inactive'}`}>
                                    {p.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.3rem 0.60rem', fontSize: '0.75rem' }} 
                                    onClick={() => handleTogglePlanoStatus(p._id, p.ativo)}
                                  >
                                    {p.ativo ? 'Desativar' : 'Ativar'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {planos.length === 0 && (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                  Nenhum plano cadastrado no sistema.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- FORMULÁRIO DE CRIAÇÃO DE NOVO PLANO --- */
                  <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: 0 }}>Cadastrar Plano de Cobrança</h3>
                      <button className="btn btn-secondary" onClick={() => setIsCriandoPlano(false)}>
                        Voltar
                      </button>
                    </div>

                    <div className="card">
                      <form onSubmit={handleAddPlano} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div className="form-group">
                          <label>Nome do Plano (Único)</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Plano Ouro Corporativo"
                            value={newPlano.nome}
                            onChange={e => setNewPlano({ ...newPlano, nome: e.target.value })}
                            required
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label>Tipo de Cobrança</label>
                            <select
                              value={newPlano.tipoCobranca}
                              onChange={e => setNewPlano({ ...newPlano, tipoCobranca: e.target.value as any })}
                              required
                            >
                              <option value="POR_VEICULO">Unitário por Veículo</option>
                              <option value="FIXO_GLOBAL">Fixo Global (Taxa única)</option>
                              <option value="ESCALONADO_FROTA">Escalonado por Volume de Frota</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Periodicidade</label>
                            <select
                              value={newPlano.periodicidade}
                              onChange={e => setNewPlano({ ...newPlano, periodicidade: e.target.value as any })}
                              required
                            >
                              <option value="MENSAL">Mensal</option>
                              <option value="BIMESTRAL">Bimestral</option>
                              <option value="TRIMESTRAL">Trimestral</option>
                              <option value="SEMESTRAL">Semestral</option>
                              <option value="ANUAL">Anual</option>
                            </select>
                          </div>
                        </div>

                        {(newPlano.tipoCobranca as string) !== 'ESCALONADO_FROTA' ? (
                          <div className="form-group">
                            <label>Valor Base (R$)</label>
                            <input 
                              type="number" 
                              placeholder="Ex: 85.00"
                              value={newPlano.valorBase}
                              onChange={e => setNewPlano({ ...newPlano, valorBase: e.target.value })}
                              required={(newPlano.tipoCobranca as string) !== 'ESCALONADO_FROTA'}
                            />
                          </div>
                        ) : (
                          /* --- CRIADOR DINÂMICO DE FAIXAS DE PREÇO --- */
                          <div className="form-group" style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: '#121316' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <label style={{ margin: 0, fontWeight: 'bold' }}>Faixas de Preço por Frota</label>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                                onClick={() => {
                                  const last = faixasPreco[faixasPreco.length - 1];
                                  const nextDe = last ? (last.ate || last.de) + 1 : 1;
                                  setFaixasPreco([...faixasPreco, { de: nextDe, ate: undefined, valor: 80 }]);
                                }}
                              >
                                + Adicionar Faixa
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {faixasPreco.map((f, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mín:</span>
                                  <input 
                                    type="number" 
                                    style={{ padding: '0.35rem', fontSize: '0.8rem', width: '70px' }}
                                    value={f.de} 
                                    onChange={e => {
                                      const updated = faixasPreco.map((fp, i) => i === idx ? { ...fp, de: Number(e.target.value) } : fp);
                                      setFaixasPreco(updated);
                                    }}
                                    required
                                  />

                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Máx:</span>
                                  <input 
                                    type="number" 
                                    style={{ padding: '0.35rem', fontSize: '0.8rem', width: '70px' }}
                                    value={f.ate || ''} 
                                    placeholder="∞"
                                    onChange={e => {
                                      const updated = faixasPreco.map((fp, i) => i === idx ? { ...fp, ate: e.target.value === '' ? undefined : Number(e.target.value) } : fp);
                                      setFaixasPreco(updated);
                                    }}
                                  />

                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>R$/Veíc:</span>
                                  <input 
                                    type="number" 
                                    style={{ padding: '0.35rem', fontSize: '0.8rem', width: '90px' }}
                                    value={f.valor} 
                                    onChange={e => {
                                      const updated = faixasPreco.map((fp, i) => i === idx ? { ...fp, valor: Number(e.target.value) } : fp);
                                      setFaixasPreco(updated);
                                    }}
                                    required
                                  />

                                  {faixasPreco.length > 1 && (
                                    <button 
                                      type="button" 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.35rem', color: 'var(--primary)', width: 'auto' }}
                                      onClick={() => {
                                        const updated = faixasPreco.filter((_, i) => i !== idx);
                                        setFaixasPreco(updated);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label>Fidelidade (Meses)</label>
                            <select
                              value={newPlano.fidelidadeMeses}
                              onChange={e => setNewPlano({ ...newPlano, fidelidadeMeses: e.target.value })}
                            >
                              <option value="0">Sem fidelidade</option>
                              <option value="6">6 meses</option>
                              <option value="12">12 meses</option>
                              <option value="24">24 meses</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Desconto por Fidelidade (%)</label>
                            <input 
                              type="number" 
                              placeholder="Ex: 10"
                              value={newPlano.descontoFidelidadePct}
                              onChange={e => setNewPlano({ ...newPlano, descontoFidelidadePct: e.target.value })}
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Descrição do Plano</label>
                          <textarea 
                            placeholder="Benefícios ou regras do plano..."
                            value={newPlano.descricao}
                            onChange={e => setNewPlano({ ...newPlano, descricao: e.target.value })}
                            style={{ height: '70px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCriandoPlano(false)}>
                            Cancelar
                          </button>
                          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            Salvar Plano
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- PÁGINA: LISTAGEM DE FLUXO DE CAIXA --- */}
        {currentPage === 'caixa' && (
          <div>
            <div className="view-header">
              <h1>Fluxo de Caixa (Despesas)</h1>
              <button className="btn btn-primary" onClick={() => setCurrentPage('caixa-cadastro')}>
                + Lançar Despesa
              </button>
            </div>

            <div className="table-box">
              <h3>Histórico de Saídas</h3>
              <div className="filter-bar" style={{ marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={buscaDespesa}
                  onChange={(e) => setBuscaDespesa(e.target.value)}
                />
                <select
                  value={filtroDespesaCat}
                  onChange={(e) => setFiltroDespesaCat(e.target.value)}
                >
                  <option value="todos">Todas Categorias</option>
                  {categorias.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.nome}</option>
                  ))}
                </select>
                <select
                  value={filtroDespesaMes}
                  onChange={(e) => setFiltroDespesaMes(e.target.value)}
                >
                  <option value="todos">Todos os Meses</option>
                  <option value="2026-06">Junho/2026</option>
                  <option value="2026-05">Maio/2026</option>
                  <option value="2026-04">Abril/2026</option>
                </select>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesasFiltradas.map(d => (
                      <tr key={d._id}>
                        <td>{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                        <td><strong>{d.descricao}</strong></td>
                        <td>
                          <span className="badge badge-info">{(d.categoriaId as any)?.nome || 'Sem Categoria'}</span>
                        </td>
                        <td style={{ color: 'var(--danger)', fontWeight: '600' }}>- R$ {d.valor.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PÁGINA: FORMULÁRIO DE LANÇAMENTO DE DESPESA --- */}
        {currentPage === 'caixa-cadastro' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Lançar Nova Despesa</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('caixa')}>
                Voltar
              </button>
            </div>

            <div className="card">
              <form onSubmit={handleAddDespesa} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Descrição da Saída</label>
                  <input
                    type="text"
                    placeholder="Ex: Conta de internet"
                    value={newDespesa.descricao}
                    onChange={(e) => setNewDespesa({ ...newDespesa, descricao: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 150.00"
                    value={newDespesa.valor}
                    onChange={(e) => setNewDespesa({ ...newDespesa, valor: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={newDespesa.data}
                    onChange={(e) => setNewDespesa({ ...newDespesa, data: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={newDespesa.categoria}
                    onChange={(e) => setNewDespesa({ ...newDespesa, categoria: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('caixa')}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Lançar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- PÁGINA: GESTÃO DE USUÁRIOS --- */}
        {currentPage === 'usuarios' && userRole === 'admin' && (
          <GestaoUsuarios />
        )}

        {/* --- PÁGINA: HISTÓRICO CRUZADO --- */}
        {currentPage === 'historico' && (
          <div>
            <div className="view-header">
              <h1>Histórico Cruzado de Instalações</h1>
            </div>

            <div className="card">
              <h3>Rastreabilidade Total</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Pesquise por placa de veículo ou por IMEI do rastreador para auditar toda a trajetória.</p>
              
              <form onSubmit={handleBuscarHistorico} className="filter-bar">
                <span>Buscar por:</span>
                <select
                  value={historicoTipo}
                  onChange={(e) => setHistoricoTipo(e.target.value as 'veiculo' | 'rastreador')}
                >
                  <option value="veiculo">Placa do Veículo</option>
                  <option value="rastreador">Rastreador (IMEI)</option>
                </select>
                <input
                  type="text"
                  placeholder={historicoTipo === 'veiculo' ? 'Ex: ABC1D23' : 'Ex: 358293...'}
                  value={buscaHistorico}
                  onChange={(e) => setBuscaHistorico(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Pesquisar</button>
              </form>

              {historicoResult.length > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h4>Resultados da Linha do Tempo:</h4>
                  <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {historicoResult.map((res, index) => (
                      <li key={index} className="card" style={{ background: '#1C1E26', borderLeft: '4px solid var(--primary)', padding: '1rem' }}>
                        {res}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PÁGINA: CAIXA DE ENTRADA DO TÉCNICO (MÓVEL SIMULADOR) --- */}
        {currentPage === 'tecnico-caixa' && (
          <div className="mobile-container">
            <div className="view-header">
              <h1>Caixa de Entrada</h1>
              <span className="subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Instalações Agendadas
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginTop: '1rem' }}>
              {ordensAgendadasDoTecnico.length === 0 ? (
                <div className="mobile-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                  <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Tudo limpo por aqui!</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Nenhum serviço agendado no momento.</p>
                </div>
              ) : (
                ordensAgendadasDoTecnico.map((os) => {
                  const veiculo = os.veiculoId as any;
                  const cliente = veiculo?.clienteId as any;
                  const rastreador = os.rastreadorId as any;
                  const isRejeitada = os.status === 'REJEITADO';

                  return (
                    <div 
                      key={os._id} 
                      className="mobile-card"
                      style={{ 
                        borderLeft: isRejeitada ? '4px solid var(--primary)' : '4px solid var(--success)', 
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: 'var(--bg-surface)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isRejeitada ? 'var(--primary)' : 'var(--success)', letterSpacing: '0.5px' }}>
                          {isRejeitada ? '⚠️ CORREÇÃO PENDENTE' : '📅 INSTALAÇÃO AGENDADA'}
                        </span>
                        <small style={{ color: 'var(--text-muted)' }}>
                          {os.dataCriacao ? new Date(os.dataCriacao).toLocaleDateString('pt-BR') : ''}
                        </small>
                      </div>

                      {isRejeitada && os.motivoRejeicao && (
                        <div style={{ background: 'rgba(255, 0, 60, 0.1)', border: '1px solid rgba(255, 0, 60, 0.2)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem', color: '#ffb3c1' }}>
                          <strong>Motivo da Rejeição:</strong> {os.motivoRejeicao}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliente</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-light)' }}>{cliente?.nome || 'Não informado'}</strong>
                        {cliente?.whatsapp && (
                          <a 
                            href={`https://wa.me/55${cliente.whatsapp.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color: 'var(--success)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
                          >
                            💬 Falar com Cliente ({cliente.whatsapp})
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Veículo / Placa</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{veiculo?.placa || 'N/A'}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{veiculo?.marca} {veiculo?.modelo}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Dispositivos Separados</span>
                          <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-light)' }}>📡 IMEI: {rastreador?.identificador || 'N/A'}</span>
                        </div>
                      </div>

                      {os.observacoes && (
                        <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-deep)', padding: '0.5rem', borderRadius: '4px', borderLeft: '2px solid var(--border-color)' }}>
                          Nota: {os.observacoes}
                        </div>
                      )}

                      <button 
                        type="button"
                        className="btn btn-primary" 
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          handleSelectAgendamento(os._id);
                          setCurrentPage('ordem-tecnico');
                        }}
                      >
                        {isRejeitada ? 'Corrigir e Reenviar' : 'Iniciar Instalação'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- PÁGINA: TÉCNICO ENVIANDO O.S. (MÓVEL SIMULADOR) --- */}
        {currentPage === 'ordem-tecnico' && (
          <div className="mobile-container">
            <div className="view-header" style={{ justifyContent: 'center' }}>
              <h1>Painel Técnico</h1>
            </div>

            <div className="mobile-card">
              <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Registrar Instalação</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>Informe a placa do veículo e associe os equipamentos.</p>
              
              <form onSubmit={handleSendOS} className="tech-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {selectedOSId !== 'avulsa' ? (
                  <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '1rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success)' }}>AGENDAMENTO ATIVO</span>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => {
                          setSelectedOSId('avulsa');
                          setNewOS({ placa: '', clienteId: '', rastreadorId: '', observacoes: '', fotosUrls: [] });
                          setCurrentPage('tecnico-caixa');
                        }}
                      >
                        Voltar à Caixa
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                      Placa: <strong>{newOS.placa}</strong> | Cliente: <strong>{clientes.find(c => c._id === newOS.clienteId)?.nome}</strong>
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>INSTALAÇÃO AVULSA (DO ZERO)</span>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => setCurrentPage('tecnico-caixa')}
                    >
                      Ver Caixa de Entrada
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label>Placa do Carro (Obrigatório)</label>
                  <input
                    type="text"
                    placeholder="Ex: ABC1D23"
                    value={newOS.placa}
                    onChange={(e) => setNewOS({ ...newOS, placa: e.target.value })}
                    required
                    disabled={selectedOSId !== 'avulsa'}
                  />
                </div>

                <div className="form-group">
                  <label>Selecione o Cliente</label>
                  <select
                    value={newOS.clienteId}
                    onChange={(e) => setNewOS({ ...newOS, clienteId: e.target.value })}
                    required
                    disabled={selectedOSId !== 'avulsa'}
                  >
                    <option value="">Selecione...</option>
                    {selectedOSId !== 'avulsa' && newOS.clienteId && (
                      <option value={newOS.clienteId}>
                        {clientes.find(c => c._id === newOS.clienteId)?.nome || 'Cliente Agendado'}
                      </option>
                    )}
                    {clientes.map(c => (
                      <option key={c._id} value={c._id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Rastreador IMEI (Em sua Posse)</label>
                  <select
                    value={newOS.rastreadorId}
                    onChange={(e) => setNewOS({ ...newOS, rastreadorId: e.target.value })}
                    required
                    disabled={selectedOSId !== 'avulsa'}
                  >
                    <option value="">Selecione...</option>
                    {selectedOSId !== 'avulsa' && newOS.rastreadorId && (
                      <option value={newOS.rastreadorId}>
                        {equipamentos.find(eq => eq._id === newOS.rastreadorId)?.identificador || 'Rastreador Agendado'}
                      </option>
                    )}
                    {equipamentos.filter(eq => eq.status === 'COM_TECNICO').map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.identificador} ({eq.modelo})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Observações Adicionais</label>
                  <textarea
                    placeholder="Ex: Rastreador sob o painel de fusíveis."
                    value={newOS.observacoes}
                    onChange={(e) => setNewOS({ ...newOS, observacoes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Fotos Comprobatórias</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label className="os-photo-box" style={{ flex: 1, minWidth: '120px', height: '90px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      <span>Anexar Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload} 
                      />
                    </label>
                    
                    {newOS.fotosUrls.map((url, i) => (
                      <div key={i} className="os-photo-box" style={{ position: 'relative', width: '90px', height: '90px', padding: 0, overflow: 'hidden' }}>
                        <img src={`http://localhost:5000${url}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => setNewOS({ ...newOS, fotosUrls: newOS.fotosUrls.filter((_, idx) => idx !== i) })}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Enviar Instalação para Homologação
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal Premium de Suporte e Chamados */}
      {isSupportModalOpen && (
        <div className="modal-overlay support-modal-overlay">
          <div className="modal-content support-modal-content">
            <div className="modal-header">
              <h3>Central de Suporte</h3>
              <button className="close-btn" onClick={() => setIsSupportModalOpen(false)}>✕</button>
            </div>

            {/* Abas */}
            <div className="support-tabs">
              <button 
                className={`support-tab-btn ${supportTab === 'faq' ? 'active' : ''}`}
                onClick={() => setSupportTab('faq')}
              >
                ❓ Perguntas Frequentes (FAQ)
              </button>
              <button 
                className={`support-tab-btn ${supportTab === 'ticket' ? 'active' : ''}`}
                onClick={() => setSupportTab('ticket')}
              >
                ✉️ Relatar Problema / Suporte
              </button>
            </div>

            <div className="support-modal-body">
              {supportTab === 'faq' ? (
                <div className="support-faq-container">
                  <p className="faq-intro">
                    Antes de abrir um chamado, consulte se a sua dúvida já está listada nas resoluções rápidas abaixo:
                  </p>
                  
                  <div className="faq-list">
                    {/* FAQ 1 */}
                    <div className={`faq-item ${faqOpenIndex === 0 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 0 ? null : 0)}>
                        <span>Como dar baixa rápida em uma fatura?</span>
                        <span className="faq-arrow">▼</span>
                      </div>
                      <div className="faq-answer">
                        <p>
                          Para dar baixa de pagamento, acesse a aba <strong>Clientes</strong>, selecione o cliente correspondente e clique no botão <strong>"Ver Ficha"</strong>. Na Ficha do Cliente, vá na aba <strong>Financeiro</strong>, localize a fatura e clique no botão <strong>"Baixa Rápida"</strong>. O sistema confirmará o pagamento em tempo real.
                        </p>
                      </div>
                    </div>

                    {/* FAQ 2 */}
                    <div className={`faq-item ${faqOpenIndex === 1 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 1 ? null : 1)}>
                        <span>Por que um veículo recém cadastrado não aparece na contagem de cobrança?</span>
                        <span className="faq-arrow">▼</span>
                      </div>
                      <div className="faq-answer">
                        <p>
                          O faturamento do AP RASTRO segue a regra de <strong>cobrabilidade por instalação ativa</strong>. Um veículo recém cadastrado consta no status de <em>"Aguardando Instalação"</em> (Sem cobrança). A cobrança mensal só é iniciada após o administrador homologar e aprovar a Ordem de Serviço (O.S.) correspondente a esse veículo.
                        </p>
                      </div>
                    </div>

                    {/* FAQ 3 */}
                    <div className={`faq-item ${faqOpenIndex === 2 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 2 ? null : 2)}>
                        <span>Como destinar um rastreador ou chip de celular para um instalador?</span>
                        <span className="faq-arrow">▼</span>
                      </div>
                      <div className="faq-answer">
                        <p>
                          Vá na aba <strong>Estoque</strong>, localize o equipamento (seja o IMEI do rastreador ou ICCID do chip) que está com o status <em>"Estoque"</em>. Clique em <strong>"Transferir"</strong>, selecione o técnico responsável no dropdown de destino e confirme. O status do equipamento mudará para <em>"Com Técnico"</em> e ficará pronto para uso em campo.
                        </p>
                      </div>
                    </div>

                    {/* FAQ 4 */}
                    <div className={`faq-item ${faqOpenIndex === 3 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 3 ? null : 3)}>
                        <span>Como lançar uma despesa administrativa no sistema?</span>
                        <span className="faq-arrow">▼</span>
                      </div>
                      <div className="faq-answer">
                        <p>
                          Acesse a aba <strong>Fluxo de Caixa</strong> e clique no botão <strong>"+"</strong> no canto superior direito para cadastrar uma nova despesa. Preencha a descrição, valor, data do lançamento e selecione a categoria correspondente. Essa ação recalcula os lucros e despesas do dashboard em tempo real.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="support-ticket-container">
                  {supportSuccessTicketId ? (
                    <div className="support-success-box">
                      <div className="success-icon">✓</div>
                      <h4>Chamado Registrado!</h4>
                      <p className="ticket-id-tag">ID do Ticket: <strong>{supportSuccessTicketId}</strong></p>
                      <p>
                        Seu problema foi salvo no banco. Para notificar o suporte por e-mail, clique no botão abaixo.
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        <a href={supportMailtoUrl} className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                          ✉️ Abrir Aplicativo de E-mail
                        </a>
                        
                        <button className="btn btn-secondary" onClick={() => setSupportSuccessTicketId(null)}>
                          Fechar / Novo Chamado
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendTicket} className="support-form">
                      {supportError && <div className="error-message support-error">{supportError}</div>}
                      
                      <div className="form-group-row">
                        <div className="form-group select-group">
                          <label htmlFor="support-page">Página/Tela do Erro:</label>
                          <select
                            id="support-page"
                            value={supportForm.pagina}
                            onChange={(e) => setSupportForm({ ...supportForm, pagina: e.target.value })}
                          >
                            <option value="Dashboard">Dashboard</option>
                            <option value="Clientes">Clientes</option>
                            <option value="Técnicos">Técnicos</option>
                            <option value="Estoque">Estoque</option>
                            <option value="Ordens de Serviço">Ordens de Serviço</option>
                            <option value="Faturas">Faturas</option>
                            <option value="Fluxo de Caixa">Fluxo de Caixa</option>
                            <option value="Histórico Cruzado">Histórico Cruzado</option>
                          </select>
                        </div>

                        <div className="form-group select-group">
                          <label htmlFor="support-type">Tipo de Erro:</label>
                          <select
                            id="support-type"
                            value={supportForm.tipoErro}
                            onChange={(e) => setSupportForm({ ...supportForm, tipoErro: e.target.value })}
                          >
                            <option value="Bug na Interface">Bug na Interface</option>
                            <option value="Erro nos Cálculos">Erro nos Cálculos</option>
                            <option value="Dúvida de Operação">Dúvida de Operação</option>
                            <option value="Instalação / O.S.">Instalação / O.S.</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="support-desc">Descrição Detalhada do Problema:</label>
                        <textarea
                          id="support-desc"
                          rows={4}
                          value={supportForm.descricao}
                          onChange={(e) => setSupportForm({ ...supportForm, descricao: e.target.value })}
                          placeholder="Por favor, descreva detalhadamente o comportamento inesperado que ocorreu..."
                        />
                      </div>

                      <div className="support-footer-info">
                        <span>Destinatário técnico: <strong>ANDREWLAMEIRA30@GMAIL.COM</strong></span>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={supportSending}
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        {supportSending ? 'Registrando Chamado...' : 'Enviar Chamado de Suporte'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- MODAIS DE EDIÇÃO --- */}
      {/* Modal Edição Cliente */}
      {editCliente && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Editar Cliente</h3>
              <button className="close-btn" onClick={() => setEditCliente(null)}>✕</button>
            </div>
            <form onSubmit={handleEditClienteSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Nome Completo / Razão Social</label>
                <input type="text" value={editCliente.nome} onChange={(e) => setEditCliente({...editCliente, nome: e.target.value})} required className="input" />
              </div>
              <div className="form-group">
                <label>Documento</label>
                <input type="text" value={editCliente.documento} onChange={(e) => setEditCliente({...editCliente, documento: maskCpfCnpj(e.target.value)})} required className="input" />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" value={editCliente.email} onChange={(e) => setEditCliente({...editCliente, email: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input type="text" value={editCliente.whatsapp} onChange={(e) => setEditCliente({...editCliente, whatsapp: maskTelefone(e.target.value)})} className="input" />
              </div>
              <button type="submit" className="btn btn-primary">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edição Veículo */}
      {editVeiculo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Editar Veículo</h3>
              <button className="close-btn" onClick={() => setEditVeiculo(null)}>✕</button>
            </div>
            <form onSubmit={handleEditVeiculoSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Placa</label>
                <input type="text" value={editVeiculo.placa} onChange={(e) => setEditVeiculo({...editVeiculo, placa: maskPlaca(e.target.value)})} required className="input" />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input type="text" value={editVeiculo.marca} onChange={(e) => setEditVeiculo({...editVeiculo, marca: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input type="text" value={editVeiculo.modelo} onChange={(e) => setEditVeiculo({...editVeiculo, modelo: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Cor</label>
                <input type="text" value={editVeiculo.cor} onChange={(e) => setEditVeiculo({...editVeiculo, cor: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Ano</label>
                <input type="text" value={editVeiculo.ano} onChange={(e) => setEditVeiculo({...editVeiculo, ano: e.target.value})} className="input" />
              </div>
              
              <div className="form-group">
                <label>Rastreador Instalado</label>
                <select 
                  value={editVeiculo.rastreadorId || ''} 
                  onChange={(e) => setEditVeiculo({...editVeiculo, rastreadorId: e.target.value})}
                  className="input"
                >
                  <option value="">Nenhum</option>
                  {equipamentos
                    .filter(eq => eq.status === 'ESTOQUE' || eq.status === 'COM_TECNICO' || eq._id === editVeiculo.rastreadorId)
                    .map(eq => (
                      <option key={eq._id} value={eq._id}>
                        {eq.identificador} {eq._id === editVeiculo.rastreadorId ? '(Atual)' : ''}
                      </option>
                    ))}
                </select>
              </div>
              {editVeiculo.rastreadorId && (
                <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {(() => {
                    const eq = equipamentos.find(e => e._id === editVeiculo.rastreadorId);
                    if (eq) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><strong>ICCID:</strong> <span style={{color: 'var(--primary)'}}>{eq.iccid || 'Não informado'}</span></div>
                          <div><strong>Linha M2M:</strong> <span style={{color: 'var(--primary)'}}>{eq.numeroLinha || 'Não informado'}</span></div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
              <button type="submit" className="btn btn-primary">Salvar Veículo</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edição Equipamento */}
      {editEquipamento && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Editar Equipamento</h3>
              <button className="close-btn" onClick={() => setEditEquipamento(null)}>✕</button>
            </div>
            <form onSubmit={handleEditEquipamentoSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>IMEI / Identificador</label>
                <input type="text" value={editEquipamento.identificador} onChange={(e) => setEditEquipamento({...editEquipamento, identificador: e.target.value})} required className="input" />
              </div>
              <div className="form-group">
                <label>ICCID (Chip)</label>
                <input type="text" value={editEquipamento.iccid} onChange={(e) => setEditEquipamento({...editEquipamento, iccid: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Número da Linha</label>
                <input type="text" value={editEquipamento.numeroLinha} onChange={(e) => setEditEquipamento({...editEquipamento, numeroLinha: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Operadora</label>
                <input type="text" value={editEquipamento.operadora} onChange={(e) => setEditEquipamento({...editEquipamento, operadora: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input type="text" value={editEquipamento.marca} onChange={(e) => setEditEquipamento({...editEquipamento, marca: e.target.value})} className="input" />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input type="text" value={editEquipamento.modelo} onChange={(e) => setEditEquipamento({...editEquipamento, modelo: e.target.value})} className="input" />
              </div>
              <button type="submit" className="btn btn-primary">Salvar Equipamento</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Fatura Avulsa */}
      {isFaturaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nova Fatura Avulsa</h2>
              <button className="close-btn" onClick={() => setIsFaturaModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateFatura} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Cliente</label>
                <select value={newFatura.clienteId} onChange={(e) => setNewFatura({...newFatura, clienteId: e.target.value})} className="input" required>
                  <option value="">Selecione o Cliente</option>
                  {clientes.filter(c => c.ativo).map(c => (
                    <option key={c._id} value={c._id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="text" placeholder="Ex: 80.00" value={newFatura.valor} onChange={(e) => {
                  let val = e.target.value.replace(',', '.');
                  val = val.replace(/[^0-9.]/g, ''); // permite apenas números e pontos
                  setNewFatura({...newFatura, valor: val});
                }} className="input" required />
              </div>
              <div className="form-group">
                <label>Vencimento</label>
                <input type="date" value={newFatura.dataVencimento} onChange={(e) => setNewFatura({...newFatura, dataVencimento: e.target.value})} className="input" required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={newFatura.status} onChange={(e) => setNewFatura({...newFatura, status: e.target.value})} className="input">
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                  <option value="ATRASADO">Atrasado</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Gerando...' : 'Gerar Fatura'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Fatura */}
      {editFatura && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Fatura</h2>
              <button className="close-btn" onClick={() => setEditFatura(null)}>×</button>
            </div>
            <form onSubmit={handleEditFaturaSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" value={editFatura.valor} onChange={(e) => setEditFatura({...editFatura, valor: Number(e.target.value)})} className="input" required />
              </div>
              <div className="form-group">
                <label>Vencimento</label>
                <input type="date" value={editFatura.dataVencimento ? editFatura.dataVencimento.split('T')[0] : ''} onChange={(e) => setEditFatura({...editFatura, dataVencimento: e.target.value})} className="input" required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editFatura.status} onChange={(e) => setEditFatura({...editFatura, status: e.target.value})} className="input">
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                  <option value="ATRASADO">Atrasado</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Salvar Fatura</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Checkout Fatura */}
      {checkoutFaturaId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>Checkout de Pagamento</h2>
              <button className="close-btn" onClick={() => setCheckoutFaturaId(null)}>×</button>
            </div>
            <form onSubmit={handleCheckoutSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fatura Original:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>R$ {Number(checkoutFaturaId.valor).toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Desconto (R$)</label>
                  <input type="number" step="0.01" min="0" value={checkoutData.desconto} onChange={(e) => setCheckoutData({...checkoutData, desconto: Number(e.target.value)})} className="input" />
                </div>
                <div className="form-group">
                  <label>Juros/Multa (R$)</label>
                  <input type="number" step="0.01" min="0" value={checkoutData.acrescimo} onChange={(e) => setCheckoutData({...checkoutData, acrescimo: Number(e.target.value)})} className="input" />
                </div>
              </div>

              <div style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>Total Devido:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                  R$ {(Number(checkoutFaturaId.valor) + checkoutData.acrescimo - checkoutData.desconto).toFixed(2)}
                </span>
              </div>

              <div className="form-group">
                <label>Forma de Pagamento</label>
                <select value={checkoutData.formaPagamento} onChange={(e) => setCheckoutData({...checkoutData, formaPagamento: e.target.value})} className="input" required>
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro Espécie</option>
                  <option value="CARTÃO DE CRÉDITO">Cartão de Crédito</option>
                  <option value="CARTÃO DE DÉBITO">Cartão de Débito</option>
                  <option value="BOLETO BANCÁRIO">Boleto Bancário</option>
                  <option value="TED/DOC">Transferência TED/DOC</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--success)' }}>Valor Recebido Agora (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={checkoutData.valorPago} 
                  onChange={(e) => setCheckoutData({...checkoutData, valorPago: Number(e.target.value)})} 
                  className="input" 
                  style={{ borderColor: 'var(--success)', fontSize: '1.2rem' }}
                  required 
                />
              </div>

              {checkoutData.valorPago > 0 && checkoutData.valorPago < (Number(checkoutFaturaId.valor) + checkoutData.acrescimo - checkoutData.desconto) && (
                <div style={{ background: 'rgba(255, 0, 60, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--danger)', marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Atenção: Pagamento Parcial Detectado</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                    O valor recebido é menor que o total. O sistema marcará esta fatura como Parcial e <strong>gerará automaticamente uma nova fatura</strong> com o saldo restante (R$ {((Number(checkoutFaturaId.valor) + checkoutData.acrescimo - checkoutData.desconto) - checkoutData.valorPago).toFixed(2)}).
                  </p>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-main)' }}>Nova Data de Vencimento para o Restante</label>
                    <input 
                      type="date" 
                      value={checkoutData.novaDataVencimento} 
                      onChange={(e) => setCheckoutData({...checkoutData, novaDataVencimento: e.target.value})} 
                      className="input" 
                      required 
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Confirmar Pagamento e Gerar Protocolo
              </button>
            </form>
          </div>
        </div>
      )}
      {/* MODAL INATIVAR CLIENTE */}
      {showInativarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirmar Inativação</h2>
              <button className="close-btn" onClick={() => setShowInativarModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert-warning" style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <strong>Atenção:</strong> Ao inativar, este cliente parará de gerar novas faturas e será removido das métricas principais.
              </div>
              <div className="form-group">
                <label>Categoria do Cancelamento *</label>
                <select 
                  className="input" 
                  value={motivoInativacao}
                  onChange={(e) => setMotivoInativacao(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecione um motivo...</option>
                  <option value="Preço / Custo">Preço / Custo</option>
                  <option value="Qualidade do Serviço">Qualidade do Serviço / Produto</option>
                  <option value="Suporte Técnico Ineficaz">Suporte Técnico Ineficaz</option>
                  <option value="Concorrência">Foi para a Concorrência</option>
                  <option value="Veículo Vendido">Veículo Vendido / Sinistro</option>
                  <option value="Inadimplência">Inadimplência</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Observações Adicionais (Detalhes)</label>
                <textarea 
                  className="input" 
                  rows={3}
                  placeholder="Forneça detalhes adicionais sobre o cancelamento..."
                  value={detalhesInativacao}
                  onChange={(e) => setDetalhesInativacao(e.target.value)}
                />
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowInativarModal(false)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={confirmInativarCliente} disabled={!motivoInativacao.trim()}>
                  Confirmar Inativação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
