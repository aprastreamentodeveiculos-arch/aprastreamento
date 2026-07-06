
import { StatCard } from './StatCard';
import type { Cliente } from '../../services/api';

interface DashboardProps {
  totalReceitaEstimada: number;
  totalVeiculosMonitorados: number;
  lucroReal: number;
  totalDespesas: number;
  fluxoAbril: { receita: number; despesa: number };
  fluxoMaio: { receita: number; despesa: number };
  fluxoJunho: { receita: number; despesa: number };
  maxVal: number;
  offsetAtrasadas: number;
  offsetPendentes: number;
  offsetPagas: number;
  valorMensalidadesPagas: number;
  valorMensalidadesPendentes: number;
  valorMensalidadesAtrasadas: number;
  mensalidadesPagasCount: number;
  mensalidadesPendentesCount: number;
  mensalidadesAtrasadasCount: number;
  clientes: Cliente[];
  handleAbrirFichaCliente: (id: string) => void;
  getAvatarColor: (id: string) => string;
  getInitials: (nome: string) => string;
}

export function Dashboard(props: DashboardProps) {
  return (
    <div className="dashboard-wrapper">
      <div className="view-header">
        <h1>Dashboard Operacional</h1>
        <div className="header-actions">
           {/* Aqui no futuro entra o seletor de período do mockup e botões de exportação */}
        </div>
      </div>

      <div className="dashboard-grid">
        <StatCard 
          title="Recorrência Mensal"
          value={`R$ ${props.totalReceitaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trendValue="1.19%"
          trendUp={true}
          iconColorClass="primary"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>}
        />
        <StatCard 
          title="Veículos Monitorados"
          value={`${props.totalVeiculosMonitorados} veículos`}
          trendValue="1.42%"
          trendUp={true}
          iconColorClass="blue"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><path d="M16 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
        />
        <StatCard 
          title="Lucro Real Estimado"
          value={`R$ ${props.lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trendValue="0.29%"
          trendUp={true}
          iconColorClass="purple"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard 
          title="Despesas Acumuladas"
          value={`R$ ${props.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trendValue="0.15%"
          trendUp={false}
          iconColorClass="yellow"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
      </div>

      <div className="activity-section">
        {/* Gráficos adicionais seriam componentes separados idealmente, mas mantemos por compatibilidade inicial */}
        <div className="card glass-panel donut-chart-box">
          <h3>Faturamento Mensal</h3>
          <div className="donut-chart-container">
            <svg className="donut-svg" width="150" height="150" viewBox="0 0 100 100">
              <circle className="donut-circle-bg" cx="50" cy="50" r="40" />
              <circle className="donut-circle-val3" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: props.offsetAtrasadas, stroke: 'var(--primary)', filter: 'drop-shadow(0 0 5px rgba(255, 0, 60, 0.5))' }} />
              <circle className="donut-circle-val2" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: props.offsetPendentes, stroke: 'var(--accent-yellow)', filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }} />
              <circle className="donut-circle-val1" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: props.offsetPagas, stroke: 'var(--success)', filter: 'drop-shadow(0 0 5px rgba(57, 255, 20, 0.5))' }} />
            </svg>
            <div className="donut-text">
              <h3 style={{ fontSize: '1.25rem' }}>R$ {props.valorMensalidadesPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <span>Recebido</span>
            </div>
          </div>
          <div className="donut-legend">
            <div className="legend-item">
              <div className="legend-label-group">
                <div className="legend-dot" style={{ backgroundColor: 'var(--success)' }}></div>
                <span>Recebidas (Pagas)</span>
              </div>
              <strong>R$ {props.valorMensalidadesPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({props.mensalidadesPagasCount})</strong>
            </div>
            <div className="legend-item">
              <div className="legend-label-group">
                <div className="legend-dot" style={{ backgroundColor: 'var(--accent-yellow)' }}></div>
                <span>Pendentes</span>
              </div>
              <strong>R$ {props.valorMensalidadesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({props.mensalidadesPendentesCount})</strong>
            </div>
            <div className="legend-item">
              <div className="legend-label-group">
                <div className="legend-dot" style={{ backgroundColor: 'var(--primary)' }}></div>
                <span>Atrasadas</span>
              </div>
              <strong>R$ {props.valorMensalidadesAtrasadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({props.mensalidadesAtrasadasCount})</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
