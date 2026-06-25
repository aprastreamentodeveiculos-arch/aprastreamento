const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback dinâmico: se estiver rodando na produção da Vercel
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://aprastreamento-api.onrender.com';
  }
  return 'http://localhost:5000';
};

const API_BASE = getApiBase() + '/api';


// Tipagem base
export interface Cliente {
  _id: string;
  nome: string;
  documento: string;
  email?: string;
  whatsapp?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  ativo: boolean;
  veiculosCount?: number;
  createdAt?: string;
}

export interface Tecnico {
  _id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
}

export interface Equipamento {
  _id: string;
  tipo: 'RASTREADOR' | 'CHIP';
  identificador: string;
  numeroLinha?: string;
  operadora?: string;
  apn?: string;
  marca?: string;
  modelo?: string;
  status: 'ESTOQUE' | 'COM_TECNICO' | 'INSTALADO' | 'DEFEITUOSO' | 'DEV_FORNECEDOR';
  tecnicoResponsavelId?: string | Tecnico;
}

export interface OrdemServico {
  _id: string;
  tecnicoId: string | { _id: string; nome: string };
  veiculoId: string | { _id: string; placa: string; clienteId?: { _id: string; nome: string } };
  rastreadorId: string | { _id: string; identificador: string };
  chipId: string | { _id: string; identificador: string };
  status: 'AGENDADA' | 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  dataCriacao?: string;
  fotosUrls: string[];
  observacoes?: string;
  motivoRejeicao?: string;
}

export interface Mensalidade {
  _id: string;
  clienteId: { _id: string; nome: string; documento: string; whatsapp: string };
  dataVencimento: string;
  dataEmissao: string;
  dataPagamento?: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
}

export interface CategoriaDespesa {
  _id: string;
  nome: string;
}

export interface Despesa {
  _id: string;
  descricao: string;
  valor: number;
  data: string;
  categoriaId: CategoriaDespesa | string;
}

// Funções de requisição genéricas
async function request(url: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro na requisição da API.');
    }
    return data;
  } catch (err: any) {
    console.error(`Erro na requisição ${url}:`, err);
    throw err;
  }
}

// Serviços expostos
export const api = {
  // Clientes
  clientes: {
    list: (): Promise<Cliente[]> => request('/clientes'),
    create: (data: Partial<Cliente>): Promise<Cliente> => 
      request('/clientes', { method: 'POST', body: JSON.stringify(data) }),
    panorama: (id: string): Promise<{
      cliente: Cliente;
      veiculos: any[];
      mensalidades: Mensalidade[];
      historico: any[];
    }> => request(`/clientes/${id}/panorama`)
  },

  // Técnicos
  tecnicos: {
    list: (): Promise<Tecnico[]> => request('/tecnicos'),
    create: (data: Partial<Tecnico>): Promise<Tecnico> => 
      request('/tecnicos', { method: 'POST', body: JSON.stringify(data) })
  },

  // Equipamentos
  equipamentos: {
    list: (): Promise<Equipamento[]> => request('/equipamentos'),
    create: (data: Partial<Equipamento>): Promise<Equipamento> => 
      request('/equipamentos', { method: 'POST', body: JSON.stringify(data) }),
    transfer: (id: string, tecnicoId: string | null): Promise<any> => 
      request(`/equipamentos/${id}/transferir`, { 
        method: 'PUT', 
        body: JSON.stringify({ tecnicoId }) 
      }),
    updateStatus: (id: string, status: string): Promise<any> =>
      request(`/equipamentos/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
  },

  // Ordens de Serviço
  ordens: {
    list: (filtros?: { status?: string; tecnicoId?: string }): Promise<OrdemServico[]> => {
      const params = new URLSearchParams();
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.tecnicoId) params.append('tecnicoId', filtros.tecnicoId);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/ordens${query}`);
    },
    create: (data: {
      tecnicoId: string;
      clienteId: string;
      placa: string;
      marca?: string;
      modelo?: string;
      cor?: string;
      ano?: string;
      chassi?: string;
      renavam?: string;
      rastreadorId: string;
      chipId: string;
      observacoes?: string;
      fotosUrls?: string[];
      status?: string;
    }): Promise<OrdemServico> => request('/ordens', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string): Promise<any> => request(`/ordens/${id}/aprovar`, { method: 'PUT' }),
    reject: (id: string, motivoRejeicao: string): Promise<any> => 
      request(`/ordens/${id}/rejeitar`, { 
        method: 'PUT', 
        body: JSON.stringify({ motivoRejeicao }) 
      }),
    concluir: (id: string, data: { observacoes?: string; fotosUrls?: string[] }): Promise<any> =>
      request(`/ordens/${id}/concluir`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Financeiro (Mensalidades)
  financeiro: {
    list: (filtros?: { status?: string; clienteId?: string }): Promise<Mensalidade[]> => {
      const params = new URLSearchParams();
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.clienteId) params.append('clienteId', filtros.clienteId);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/financeiro${query}`);
    },
    baixar: (id: string): Promise<any> => request(`/financeiro/${id}/baixar`, { method: 'PUT' }),
    faturarCron: (): Promise<{ message: string; faturasGeradas: number }> => 
      request('/financeiro/faturamento-cron', { method: 'POST' })
  },

  // Caixa (Despesas e Categorias)
  caixa: {
    listDespesas: (filtros?: { busca?: string; categoriaId?: string; mes?: string }): Promise<{ total: number; count: number; despesas: Despesa[] }> => {
      const params = new URLSearchParams();
      if (filtros?.busca) params.append('busca', filtros.busca);
      if (filtros?.categoriaId) params.append('categoriaId', filtros.categoriaId);
      if (filtros?.mes) params.append('mes', filtros.mes);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/caixa/despesas${query}`);
    },
    createDespesa: (data: {
      descricao: string;
      valor: number;
      categoriaId: string;
      data?: string;
    }): Promise<Despesa> => request('/caixa/despesas', { method: 'POST', body: JSON.stringify(data) }),
    listCategorias: (): Promise<CategoriaDespesa[]> => request('/caixa/categorias'),
    createCategoria: (nome: string): Promise<CategoriaDespesa> => 
      request('/caixa/categorias', { method: 'POST', body: JSON.stringify({ nome }) })
  },

  // Histórico Cruzado
  historico: {
    veiculo: (placa: string): Promise<{ veiculo: any; historico: any[] }> => 
      request(`/historico/veiculo/${placa}`),
    rastreador: (imei: string): Promise<{ rastreador: any; historico: any[] }> => 
      request(`/historico/rastreador/${imei}`)
  },

  // Upload de Fotos
  upload: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('foto', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
      // O fetch define o Content-Type como multipart/form-data com o boundary correto automaticamente
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao realizar upload da foto.');
    }
    return data;
  }
};
