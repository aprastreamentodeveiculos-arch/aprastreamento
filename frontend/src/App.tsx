import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import './App.css';
import { api, type Cliente, type Tecnico, type Equipamento, type OrdemServico, type Mensalidade, type Despesa, type CategoriaDespesa } from './services/api';

function App() {
  // Controle de Visualização e Perfis
  const [userRole, setUserRole] = useState<'admin' | 'tecnico'>('admin');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [userName, setUserName] = useState<string>('Andrew Gerente');

  // Estados reais integrados à API (MongoDB)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);

  // Estados dos formulários de cadastro
  const [newCliente, setNewCliente] = useState({ nome: '', documento: '', email: '', whatsapp: '' });
  const [newTecnico, setNewTecnico] = useState({ nome: '', telefone: '' });
  const [newDespesa, setNewDespesa] = useState({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: '' });
  const [newOS, setNewOS] = useState<{
    placa: string;
    clienteId: string;
    rastreadorId: string;
    chipId: string;
    observacoes: string;
    fotosUrls: string[];
  }>({ placa: '', clienteId: '', rastreadorId: '', chipId: '', observacoes: '', fotosUrls: [] });

  const [selectedOSId, setSelectedOSId] = useState<string>('avulsa');
  
  const [scheduleOS, setScheduleOS] = useState({
    clienteId: '',
    placa: '',
    tecnicoId: '',
    rastreadorId: '',
    chipId: '',
    observacoes: ''
  });

  const [selectedClientePanorama, setSelectedClientePanorama] = useState<any>(null);
  const [fichaTab, setFichaTab] = useState<'veiculos' | 'historico' | 'financeiro'>('veiculos');

  const handleSelectAgendamento = (osId: string) => {
    setSelectedOSId(osId);
    if (osId === 'avulsa') {
      setNewOS({ placa: '', clienteId: '', rastreadorId: '', chipId: '', observacoes: '', fotosUrls: [] });
    } else {
      const os = ordens.find(o => o._id === osId);
      if (os) {
        setNewOS({
          placa: (os.veiculoId as any)?.placa || '',
          clienteId: (os.veiculoId as any)?.clienteId?._id || (os.veiculoId as any)?.clienteId || '',
          rastreadorId: (os.rastreadorId as any)?._id || os.rastreadorId || '',
          chipId: (os.chipId as any)?._id || os.chipId || '',
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

  // Estados do Módulo de Estoque
  const [filtroEstoqueTipo, setFiltroEstoqueTipo] = useState<string>('todos');
  const [filtroEstoqueStatus, setFiltroEstoqueStatus] = useState<string>('todos');
  const [transferindoId, setTransferindoId] = useState<string | null>(null);
  const [tecnicoParaTransferencia, setTecnicoParaTransferencia] = useState<string>('');
  const [newRastreador, setNewRastreador] = useState({ identificador: '', marca: '', modelo: '', observacoes: '' });
  const [newChip, setNewChip] = useState({ identificador: '', numeroLinha: '', operadora: '', apn: '' });

  // Carregar dados gerais do banco de dados
  const carregarDados = async () => {
    try {
      const [dataClientes, dataTecnicos, dataEquipamentos, dataOrdens, dataCategorias, dataMensalidades] = await Promise.all([
        api.clientes.list(),
        api.tecnicos.list(),
        api.equipamentos.list(),
        api.ordens.list(),
        api.caixa.listCategorias(),
        api.financeiro.list()
      ]);

      setClientes(dataClientes);
      setTecnicos(dataTecnicos);
      setEquipamentos(dataEquipamentos);
      setOrdens(dataOrdens);
      setCategorias(dataCategorias);
      setMensalidades(dataMensalidades);

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

  // Recarregar dados sempre que trocar de tela
  useEffect(() => {
    carregarDados();
  }, [currentPage]);

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

  // Cálculos Financeiros Dinâmicos
  const totalReceitaEstimada = clientes.reduce((acc, c) => acc + ((c.veiculosCount || 0) * 80), 0); 
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const lucroReal = mensalidades.filter(m => m.status === 'PAGO').reduce((acc, m) => acc + m.valor, 0) - totalDespesas;

  // Filtrar dados por mês (Abril, Maio, Junho de 2026) para o gráfico de fluxo de caixa
  const obterFluxoMes = (mesZeroIndexed: number) => {
    const descMes = despesas.filter(d => {
      const data = new Date(d.data);
      return data.getFullYear() === 2026 && data.getMonth() === mesZeroIndexed;
    }).reduce((acc, d) => acc + d.valor, 0);

    const recMes = mensalidades.filter(m => {
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

  // Métricas do Donut Financeiro de Mensalidades (Contagem e Valores em Reais R$)
  const mensalidadesPagasCount = mensalidades.filter(m => m.status === 'PAGO').length;
  const mensalidadesPendentesCount = mensalidades.filter(m => m.status === 'PENDENTE').length;
  const mensalidadesAtrasadasCount = mensalidades.filter(m => m.status === 'ATRASADO').length;

  const valorMensalidadesPagas = mensalidades.filter(m => m.status === 'PAGO').reduce((acc, m) => acc + m.valor, 0);
  const valorMensalidadesPendentes = mensalidades.filter(m => m.status === 'PENDENTE').reduce((acc, m) => acc + m.valor, 0);
  const valorMensalidadesAtrasadas = mensalidades.filter(m => m.status === 'ATRASADO').reduce((acc, m) => acc + m.valor, 0);

  const totalValorMensalidades = valorMensalidadesPagas + valorMensalidadesPendentes + valorMensalidadesAtrasadas;
  const pctPagas = totalValorMensalidades > 0 ? (valorMensalidadesPagas / totalValorMensalidades) : 0;
  const pctPendentes = totalValorMensalidades > 0 ? (valorMensalidadesPendentes / totalValorMensalidades) : 0;
  const pctAtrasadas = totalValorMensalidades > 0 ? (valorMensalidadesAtrasadas / totalValorMensalidades) : 0;

  // offsets do Donut segmentado (Pagas, Pendentes, Atrasadas)
  const offsetPagas = 251.2 * (1 - pctPagas);
  const offsetPendentes = 251.2 * (1 - (pctPagas + pctPendentes));
  const offsetAtrasadas = 251.2 * (1 - (pctPagas + pctPendentes + pctAtrasadas));

  // Handler para cadastrar cliente
  const handleAddCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.nome || !newCliente.documento) return;
    try {
      await api.clientes.create(newCliente);
      setNewCliente({ nome: '', documento: '', email: '', whatsapp: '' });
      alert('Cliente cadastrado com sucesso!');
      carregarDados();
      setCurrentPage('clientes'); // Redireciona de volta para a listagem
    } catch (err: any) {
      alert('Erro ao cadastrar cliente: ' + err.message);
    }
  };

  // Handler para cadastrar técnico
  const handleAddTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTecnico.nome) return;
    try {
      await api.tecnicos.create(newTecnico);
      setNewTecnico({ nome: '', telefone: '' });
      alert('Técnico cadastrado com sucesso!');
      carregarDados();
      setCurrentPage('tecnicos'); // Redireciona de volta para a listagem
    } catch (err: any) {
      alert('Erro ao cadastrar técnico: ' + err.message);
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
      alert('Despesa lançada com sucesso!');
      carregarDados();
      setCurrentPage('caixa'); // Redireciona de volta para a listagem
    } catch (err: any) {
      alert('Erro ao lançar despesa: ' + err.message);
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
      alert('Foto carregada com sucesso!');
    } catch (err: any) {
      alert('Erro ao enviar foto: ' + err.message);
    }
  };

  // Handler do Técnico enviando O.S.
  const handleSendOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOS.placa || !newOS.clienteId || !newOS.rastreadorId || !newOS.chipId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    // Achar o técnico logado
    const tecnicoLogado = tecnicos.find(t => t.nome === userName);
    if (!tecnicoLogado) {
      alert('Erro: Técnico não identificado no sistema.');
      return;
    }

    try {
      if (selectedOSId !== 'avulsa') {
        // Concluir uma O.S. agendada existente
        await api.ordens.concluir(selectedOSId, {
          observacoes: newOS.observacoes,
          fotosUrls: newOS.fotosUrls
        });
        alert('Instalação da O.S. Agendada enviada com sucesso para homologação!');
      } else {
        // Criar uma nova O.S. avulsa
        await api.ordens.create({
          tecnicoId: tecnicoLogado._id,
          clienteId: newOS.clienteId,
          placa: newOS.placa,
          rastreadorId: newOS.rastreadorId,
          chipId: newOS.chipId,
          observacoes: newOS.observacoes,
          fotosUrls: newOS.fotosUrls
        });
        alert('Ordem de serviço avulsa enviada para aprovação do Administrador!');
      }
      setSelectedOSId('avulsa');
      setNewOS({ placa: '', clienteId: '', rastreadorId: '', chipId: '', observacoes: '', fotosUrls: [] });
      carregarDados();
      setCurrentPage('tecnico-caixa');
    } catch (err: any) {
      alert('Erro ao enviar O.S.: ' + err.message);
    }
  };

  const handleScheduleOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleOS.clienteId || !scheduleOS.placa || !scheduleOS.tecnicoId || !scheduleOS.rastreadorId || !scheduleOS.chipId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      await api.ordens.create({
        tecnicoId: scheduleOS.tecnicoId,
        clienteId: scheduleOS.clienteId,
        placa: scheduleOS.placa.toUpperCase(),
        rastreadorId: scheduleOS.rastreadorId,
        chipId: scheduleOS.chipId,
        observacoes: scheduleOS.observacoes,
        status: 'AGENDADA',
        fotosUrls: []
      });

      alert('Instalação agendada e enviada para a Caixa de Entrada do Técnico!');
      setScheduleOS({ clienteId: '', placa: '', tecnicoId: '', rastreadorId: '', chipId: '', observacoes: '' });
      carregarDados();
      setCurrentPage('ordens');
    } catch (err: any) {
      alert('Erro ao agendar O.S.: ' + err.message);
    }
  };

  const handleAbrirFichaCliente = async (clienteId: string) => {
    try {
      const panorama = await api.clientes.panorama(clienteId);
      setSelectedClientePanorama(panorama);
      setFichaTab('veiculos');
      setCurrentPage('clientes-ficha');
    } catch (err: any) {
      alert('Erro ao carregar a ficha do cliente: ' + err.message);
    }
  };

  const handleBaixarMensalidadeFicha = async (id: string) => {
    try {
      await api.financeiro.baixar(id);
      alert('Baixa de mensalidade registrada com sucesso!');
      carregarDados();
      if (selectedClientePanorama) {
        const panorama = await api.clientes.panorama(selectedClientePanorama.cliente._id);
        setSelectedClientePanorama(panorama);
      }
    } catch (err: any) {
      alert('Erro ao dar baixa manual na fatura: ' + err.message);
    }
  };

  // Admin aprova O.S.
  const handleApproveOS = async (osId: string) => {
    try {
      await api.ordens.approve(osId);
      alert('Instalação aprovada e veículo ativo no faturamento!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao aprovar O.S.: ' + err.message);
    }
  };

  // Admin rejeita O.S.
  const handleRejectOS = async (osId: string) => {
    const motivo = prompt('Por favor, informe o motivo de rejeição da O.S.:');
    if (!motivo) return;
    try {
      await api.ordens.reject(osId, motivo);
      alert('Ordem de serviço devolvida ao técnico!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao rejeitar O.S.: ' + err.message);
    }
  };

  // Admin dá baixa na mensalidade
  const handleBaixarMensalidade = async (id: string) => {
    try {
      await api.financeiro.baixar(id);
      alert('Baixa de mensalidade registrada com sucesso!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao dar baixa manual: ' + err.message);
    }
  };

  // Admin força faturamento
  const handleForcarFaturamento = async () => {
    try {
      const res = await api.financeiro.faturarCron();
      alert(`Ciclo de faturamento processado com sucesso! Faturas geradas: ${res.faturasGeradas}`);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao rodar faturamento automático: ' + err.message);
    }
  };

  // Cadastrar Rastreador
  const handleCadastrarRastreador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRastreador.identificador) return;
    try {
      await api.equipamentos.create({
        tipo: 'RASTREADOR',
        identificador: newRastreador.identificador,
        marca: newRastreador.marca || undefined,
        modelo: newRastreador.modelo || undefined
      });
      alert('Rastreador cadastrado no estoque com sucesso!');
      setNewRastreador({ identificador: '', marca: '', modelo: '', observacoes: '' });
      carregarDados();
      setCurrentPage('estoque');
    } catch (err: any) {
      alert('Erro ao cadastrar rastreador: ' + err.message);
    }
  };

  // Cadastrar Chip
  const handleCadastrarChip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChip.identificador) return;
    try {
      await api.equipamentos.create({
        tipo: 'CHIP',
        identificador: newChip.identificador,
        numeroLinha: newChip.numeroLinha || undefined,
        operadora: newChip.operadora || undefined,
        apn: newChip.apn || undefined
      });
      alert('Chip cadastrado no estoque com sucesso!');
      setNewChip({ identificador: '', numeroLinha: '', operadora: '', apn: '' });
      carregarDados();
      setCurrentPage('estoque');
    } catch (err: any) {
      alert('Erro ao cadastrar chip: ' + err.message);
    }
  };

  // Transferir Equipamento para Técnico
  const handleTransferirEquipamento = async (equipamentoId: string) => {
    if (!tecnicoParaTransferencia) {
      alert('Selecione um técnico para transferência.');
      return;
    }
    try {
      await api.equipamentos.transfer(equipamentoId, tecnicoParaTransferencia);
      alert('Equipamento transferido para o técnico com sucesso!');
      setTransferindoId(null);
      setTecnicoParaTransferencia('');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao transferir equipamento: ' + err.message);
    }
  };

  // Devolver Equipamento ao Estoque
  const handleDevolverAoEstoque = async (equipamentoId: string) => {
    if (!window.confirm('Confirma devolução ao estoque central?')) return;
    try {
      await api.equipamentos.transfer(equipamentoId, null);
      alert('Equipamento devolvido ao estoque central!');
      carregarDados();
    } catch (err: any) {
      alert('Erro ao devolver equipamento: ' + err.message);
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

  return (
    <div className="app-container">
      {/* Sidebar de Navegação */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userRole={userRole}
        userName={userName}
        selectedOSId={selectedOSId}
      />

      {/* Visualização de Conteúdo Principal */}
      <main className="main-content">
        {/* Barra superior de simulação */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <div className="profile-simulator">
            <span>Acesso:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'admin' | 'tecnico')}
            >
              <option value="admin">Administrador (Ver Painel Completo)</option>
              <option value="tecnico">Técnico Instalador (Ver Painel Mobile)</option>
            </select>
          </div>
        </div>

        {/* --- PÁGINA: DASHBOARD ADMIN --- */}
        {currentPage === 'dashboard' && (
          <div>
            <div className="view-header">
              <h1>Dashboard Operacional</h1>
            </div>

            {/* Grid dos Cards */}
            <div className="dashboard-grid">
              <div className="analytics-card">
                <div className="card-header-spark">
                  <div className="card-icon-container primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </div>
                  <div className="card-trend up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                    <span>1.19%</span>
                  </div>
                </div>
                <div className="card-body-spark">
                  <div className="card-info">
                    <span>Recorrência Mensal</span>
                    <h2>R$ {totalReceitaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 45" width="100%" height="100%">
                      <defs>
                        <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      <path d="M 0 35 Q 20 20 40 28 T 80 10 T 100 5 L 100 45 L 0 45 Z" fill="url(#grad-green)"/>
                      <path d="M 0 35 Q 20 20 40 28 T 80 10 T 100 5" fill="none" stroke="#22C55E" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header-spark">
                  <div className="card-icon-container blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </div>
                  <div className="card-trend up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                    <span>1.42%</span>
                  </div>
                </div>
                <div className="card-body-spark">
                  <div className="card-info">
                    <span>Veículos Monitorados</span>
                    <h2>{totalVeiculosMonitorados} veículos</h2>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 45" width="100%" height="100%">
                      <path d="M 0 25 Q 15 15 35 30 T 70 12 T 100 8 L 100 45 L 0 45 Z" fill="url(#grad-green)"/>
                      <path d="M 0 25 Q 15 15 35 30 T 70 12 T 100 8" fill="none" stroke="#22C55E" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header-spark">
                  <div className="card-icon-container purple">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div className="card-trend up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                    <span>0.29%</span>
                  </div>
                </div>
                <div className="card-body-spark">
                  <div className="card-info">
                    <span>Lucro Real Estimado</span>
                    <h2>R$ {lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 45" width="100%" height="100%">
                      <path d="M 0 38 Q 25 35 50 15 T 90 8 T 100 5 L 100 45 L 0 45 Z" fill="url(#grad-green)"/>
                      <path d="M 0 38 Q 25 35 50 15 T 90 8 T 100 5" fill="none" stroke="#22C55E" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header-spark">
                  <div className="card-icon-container yellow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div className="card-trend down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                    <span>0.15%</span>
                  </div>
                </div>
                <div className="card-body-spark">
                  <div className="card-info">
                    <span>Despesas Acumuladas</span>
                    <h2>R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 45" width="100%" height="100%">
                      <defs>
                        <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      <path d="M 0 10 Q 20 28 40 15 T 80 32 T 100 38 L 100 45 L 0 45 Z" fill="url(#grad-red)"/>
                      <path d="M 0 10 Q 20 28 40 15 T 80 32 T 100 38" fill="none" stroke="#EF4444" stroke-width="2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="activity-section">
              <div className="card">
                <h3>Fluxo de Caixa Mensal</h3>
                <div className="bar-chart-container">
                  <div className="bar-col">
                    <div className="bar-graphic in" style={{ height: `${(fluxoAbril.receita / maxVal) * 90}%` }} data-value={`R$ ${fluxoAbril.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}></div>
                    <span className="bar-label">Abr (Receita)</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-graphic out" style={{ height: `${(fluxoAbril.despesa / maxVal) * 90}%` }} data-value={`R$ ${fluxoAbril.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}></div>
                    <span className="bar-label">Abr (Despesas)</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-graphic in" style={{ height: `${(fluxoMaio.receita / maxVal) * 90}%` }} data-value={`R$ ${fluxoMaio.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}></div>
                    <span className="bar-label">Mai (Receita)</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-graphic out" style={{ height: `${(fluxoMaio.despesa / maxVal) * 90}%` }} data-value={`R$ ${fluxoMaio.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}></div>
                    <span className="bar-label">Mai (Despesas)</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-graphic in" style={{ height: `${(fluxoJunho.receita / maxVal) * 90}%` }} data-value={`R$ ${fluxoJunho.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}></div>
                    <span className="bar-label">Jun (Receita)</span>
                  </div>
                  <div className="bar-col">
                    <div className="bar-graphic out" style={{ height: `${(fluxoJunho.despesa / maxVal) * 90}%` }} data-value={`R$ ${fluxoJunho.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}></div>
                    <span className="bar-label">Jun (Despesas)</span>
                  </div>
                </div>
              </div>

              <div className="card donut-chart-box">
                <h3>Faturamento Mensal</h3>
                <div className="donut-chart-container">
                  <svg className="donut-svg" width="150" height="150" viewBox="0 0 100 100">
                    <circle className="donut-circle-bg" cx="50" cy="50" r="40" />
                    <circle className="donut-circle-val3" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: offsetAtrasadas, stroke: 'var(--primary)', filter: 'drop-shadow(0 0 5px rgba(255, 0, 60, 0.5))' }} />
                    <circle className="donut-circle-val2" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: offsetPendentes, stroke: 'var(--accent-yellow)', filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }} />
                    <circle className="donut-circle-val1" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: offsetPagas, stroke: 'var(--success)', filter: 'drop-shadow(0 0 5px rgba(57, 255, 20, 0.5))' }} />
                  </svg>
                  <div className="donut-text">
                    <h3 style={{ fontSize: '1.25rem' }}>R$ {valorMensalidadesPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <span>Recebido</span>
                  </div>
                </div>
                <div className="donut-legend">
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <div className="legend-dot" style={{ backgroundColor: 'var(--success)' }}></div>
                      <span>Recebidas (Pagas)</span>
                    </div>
                    <strong>R$ {valorMensalidadesPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({mensalidadesPagasCount})</strong>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <div className="legend-dot" style={{ backgroundColor: 'var(--accent-yellow)' }}></div>
                      <span>Pendentes</span>
                    </div>
                    <strong>R$ {valorMensalidadesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({mensalidadesPendentesCount})</strong>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <div className="legend-dot" style={{ backgroundColor: 'var(--primary)' }}></div>
                      <span>Atrasadas</span>
                    </div>
                    <strong>R$ {valorMensalidadesAtrasadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({mensalidadesAtrasadasCount})</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-box">
              <div className="table-box-header">
                <h3>Instalações Ativas / Clientes</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>Veículos Ativos</th>
                      <th>Faturamento Mensal</th>
                      <th>Status Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
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
                        <td>
                          <span className="badge badge-info">{(c.veiculosCount || 0)} veículos</span>
                        </td>
                        <td><strong>R$ {((c.veiculosCount || 0) * 80).toFixed(2)}</strong></td>
                        <td>
                          <span className={`status-badge ${(c.veiculosCount || 0) > 0 ? 'active' : 'pending'}`}>
                            {(c.veiculosCount || 0) > 0 ? 'EM DIA' : 'SEM COBRANÇA'}
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

        {/* --- PÁGINA: LISTAGEM DE CLIENTES (Tela Inteira) --- */}
        {currentPage === 'clientes' && (
          <div>
            <div className="view-header">
              <h1>Clientes e Frotas</h1>
              <button className="btn btn-primary" onClick={() => setCurrentPage('clientes-cadastro')}>
                + Cadastrar Cliente
              </button>
            </div>

            <div className="table-box">
              <h3>Frotas Ativas</h3>
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>WhatsApp</th>
                      <th>Qtd. Veículos</th>
                      <th>Vencimento Padrão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
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
                        <td>{c.whatsapp}</td>
                        <td>
                          <span className="badge badge-info">{(c.veiculosCount || 0)} veículos</span>
                        </td>
                        <td>Dia 10</td>
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
                    onChange={(e) => setNewCliente({ ...newCliente, documento: e.target.value })}
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
                    onChange={(e) => setNewCliente({ ...newCliente, whatsapp: e.target.value })}
                  />
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
          <div>
            <div className="view-header">
              <h1>Ficha do Cliente - {selectedClientePanorama.cliente.nome}</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('clientes')}>
                Voltar
              </button>
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
                💰 Mensalidades / Faturamento ({selectedClientePanorama.mensalidades.length})
              </button>
            </div>

            {/* CONTEÚDO DA ABA: VEÍCULOS (FROTA) */}
            {fichaTab === 'veiculos' && (
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
                              <td>{instalacaoAtiva?.chipId?.identificador || 'N/A'}</td>
                              <td>
                                <span className={`status-badge ${instalacaoAtiva ? 'active' : 'inactive'}`}>
                                  {instalacaoAtiva ? 'INSTALADO & ATIVO' : 'SEM DISPOSITIVO'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA: HISTÓRICO DE AUDITORIA */}
            {fichaTab === 'historico' && (
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
                          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0' }}>
                            Chip ICCID: <strong>{h.chipId?.identificador} ({h.chipId?.operadora} - {h.chipId?.numeroLinha})</strong>
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
            )}

            {/* CONTEÚDO DA ABA: FINANCEIRO (MENSALIDADES) */}
            {fichaTab === 'financeiro' && (
              <div className="table-box">
                <h3>Mensalidades do Cliente (Histórico Financeiro)</h3>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                  {selectedClientePanorama.mensalidades.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma fatura gerada para este cliente.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Valor</th>
                          <th>Emissão</th>
                          <th>Vencimento</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientePanorama.mensalidades.map((m: any) => (
                          <tr key={m._id}>
                            <td><strong>R$ {m.valor.toFixed(2)}</strong></td>
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
                                  onClick={() => handleBaixarMensalidadeFicha(m._id)}
                                >
                                  Confirmar Recebimento
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
                <button className="btn btn-secondary" onClick={() => setCurrentPage('estoque-cadastro-chip')}>
                  + Cadastrar Chip
                </button>
                <button className="btn btn-primary" onClick={() => setCurrentPage('estoque-cadastro-rastreador')}>
                  + Cadastrar Rastreador
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
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
                  <option value="todos">Todos</option>
                  <option value="ESTOQUE">Em Estoque</option>
                  <option value="COM_TECNICO">Com Técnico</option>
                  <option value="INSTALADO">Instalado</option>
                  <option value="DEFEITUOSO">Defeituoso</option>
                </select>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {equipamentos.filter(eq =>
                  (filtroEstoqueTipo === 'todos' || eq.tipo === filtroEstoqueTipo) &&
                  (filtroEstoqueStatus === 'todos' || eq.status === filtroEstoqueStatus)
                ).length} equipamento(s)
              </div>
            </div>

            {/* Tabela */}
            <div className="table-box">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Identificador (IMEI / ICCID)</th>
                      <th>Marca / Modelo</th>
                      <th>Operadora</th>
                      <th>Status</th>
                      <th>Posse / Responsável</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipamentos
                      .filter(eq =>
                        (filtroEstoqueTipo === 'todos' || eq.tipo === filtroEstoqueTipo) &&
                        (filtroEstoqueStatus === 'todos' || eq.status === filtroEstoqueStatus)
                      )
                      .map(eq => (
                        <React.Fragment key={eq._id}>
                          <tr>
                            <td>
                              <span className={`badge ${eq.tipo === 'RASTREADOR' ? 'badge-info' : 'badge-success'}`}>
                                {eq.tipo === 'RASTREADOR' ? '📡 RASTREADOR' : '📶 CHIP'}
                              </span>
                            </td>
                            <td><strong style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{eq.identificador}</strong></td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {eq.marca || '—'} {eq.modelo ? `/ ${eq.modelo}` : ''}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {eq.operadora || '—'}
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
                                      setTransferindoId(transferindoId === eq._id ? null : eq._id);
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
                              </div>
                            </td>
                          </tr>
                          {/* Linha de transferência expandida */}
                          {transferindoId === eq._id && (
                            <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                              <td colSpan={7} style={{ padding: '0.75rem 1.5rem' }}>
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
                      (filtroEstoqueTipo === 'todos' || eq.tipo === filtroEstoqueTipo) &&
                      (filtroEstoqueStatus === 'todos' || eq.status === filtroEstoqueStatus)
                    ).length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
                  {equipamentos.filter(e => e.tipo === 'RASTREADOR').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📡 Rastreadores</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                  {equipamentos.filter(e => e.tipo === 'CHIP').length}
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

        {/* --- PÁGINA: CADASTRAR RASTREADOR --- */}
        {currentPage === 'estoque-cadastro-rastreador' && (
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Cadastrar Rastreador</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('estoque')}>Voltar</button>
            </div>
            <div className="card">
              <form onSubmit={handleCadastrarRastreador} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>IMEI do Rastreador <span style={{ color: 'var(--primary)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ex: 358293029384931 (15 dígitos)"
                    value={newRastreador.identificador}
                    onChange={e => setNewRastreador({ ...newRastreador, identificador: e.target.value })}
                    maxLength={20}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Número IMEI único do dispositivo GPS.</small>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Marca</label>
                    <input
                      type="text"
                      placeholder="Ex: Teltonika, Suntech"
                      value={newRastreador.marca}
                      onChange={e => setNewRastreador({ ...newRastreador, marca: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Modelo</label>
                    <input
                      type="text"
                      placeholder="Ex: FMB920, ST310"
                      value={newRastreador.modelo}
                      onChange={e => setNewRastreador({ ...newRastreador, modelo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observações</label>
                  <textarea
                    placeholder="Informações adicionais sobre o equipamento..."
                    value={newRastreador.observacoes}
                    onChange={e => setNewRastreador({ ...newRastreador, observacoes: e.target.value })}
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

        {/* --- PÁGINA: CADASTRAR CHIP --- */}
        {currentPage === 'estoque-cadastro-chip' && (
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div className="view-header">
              <h1>Cadastrar Chip SIM</h1>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('estoque')}>Voltar</button>
            </div>
            <div className="card">
              <form onSubmit={handleCadastrarChip} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>ICCID do Chip <span style={{ color: 'var(--primary)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ex: 8955102003948576302"
                    value={newChip.identificador}
                    onChange={e => setNewChip({ ...newChip, identificador: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Número ICCID impresso no cartão SIM.</small>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Número da Linha</label>
                    <input
                      type="text"
                      placeholder="Ex: (21) 98765-4321"
                      value={newChip.numeroLinha}
                      onChange={e => setNewChip({ ...newChip, numeroLinha: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Operadora</label>
                    <select
                      value={newChip.operadora}
                      onChange={e => setNewChip({ ...newChip, operadora: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="Claro">Claro</option>
                      <option value="Vivo">Vivo</option>
                      <option value="TIM">TIM</option>
                      <option value="Oi">Oi</option>
                      <option value="Algar">Algar</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>APN</label>
                  <input
                    type="text"
                    placeholder="Ex: zap.vivo.com.br"
                    value={newChip.apn}
                    onChange={e => setNewChip({ ...newChip, apn: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Configuração de acesso a dados da operadora.</small>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>📶 Cadastrar no Estoque</button>
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
                        <div className="os-card-col">
                          <span>Chip ICCID</span>
                          <strong>{(os.chipId as any)?.identificador || 'N/A'}</strong>
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
                      .filter(eq => eq.tipo === 'RASTREADOR' && (eq.status === 'ESTOQUE' || (eq.status === 'COM_TECNICO' && (typeof eq.tecnicoResponsavelId === 'string' ? eq.tecnicoResponsavelId === scheduleOS.tecnicoId : eq.tecnicoResponsavelId?._id === scheduleOS.tecnicoId))))
                      .map(eq => (
                        <option key={eq._id} value={eq._id}>
                          {eq.identificador} ({eq.modelo}) - {eq.status === 'ESTOQUE' ? 'Estoque Central' : 'Com Técnico'}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Chip ICCID (Em Estoque ou com o Técnico)</label>
                  <select
                    value={scheduleOS.chipId}
                    onChange={(e) => setScheduleOS({ ...scheduleOS, chipId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {equipamentos
                      .filter(eq => eq.tipo === 'CHIP' && (eq.status === 'ESTOQUE' || (eq.status === 'COM_TECNICO' && (typeof eq.tecnicoResponsavelId === 'string' ? eq.tecnicoResponsavelId === scheduleOS.tecnicoId : eq.tecnicoResponsavelId?._id === scheduleOS.tecnicoId))))
                      .map(eq => (
                        <option key={eq._id} value={eq._id}>
                          {eq.identificador} ({eq.operadora}) - {eq.status === 'ESTOQUE' ? 'Estoque Central' : 'Com Técnico'}
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

        {/* --- PÁGINA: MENSALIDADES --- */}
        {currentPage === 'financeiro' && (
          <div>
            <div className="view-header">
              <h1>Gestão de Mensalidades</h1>
              <button className="btn btn-primary" onClick={handleForcarFaturamento}>
                ⚙️ Executar Ciclo de Faturamento
              </button>
            </div>

            <div className="table-box">
              <h3>Faturamento Recorrente (Baixa Manual)</h3>
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
                    {mensalidades.map(m => (
                      <tr key={m._id}>
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
                        <td><strong>R$ {m.valor.toFixed(2)}</strong></td>
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
                            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleBaixarMensalidade(m._id)}>
                              Confirmar Recebimento
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                  const chip = os.chipId as any;
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
                          <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-light)' }}>📶 Chip: {chip?.identificador || 'N/A'}</span>
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
                          setNewOS({ placa: '', clienteId: '', rastreadorId: '', chipId: '', observacoes: '', fotosUrls: [] });
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
                    {equipamentos.filter(eq => eq.tipo === 'RASTREADOR' && eq.status === 'COM_TECNICO').map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.identificador} ({eq.modelo})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chip ICCID (Em sua Posse)</label>
                  <select
                    value={newOS.chipId}
                    onChange={(e) => setNewOS({ ...newOS, chipId: e.target.value })}
                    required
                    disabled={selectedOSId !== 'avulsa'}
                  >
                    <option value="">Selecione...</option>
                    {selectedOSId !== 'avulsa' && newOS.chipId && (
                      <option value={newOS.chipId}>
                        {equipamentos.find(eq => eq._id === newOS.chipId)?.identificador || 'Chip Agendado'}
                      </option>
                    )}
                    {equipamentos.filter(eq => eq.tipo === 'CHIP' && eq.status === 'COM_TECNICO').map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.identificador} ({eq.operadora})</option>
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
    </div>
  );
}

export default App;
