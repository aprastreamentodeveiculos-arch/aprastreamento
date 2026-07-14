import { StatCard } from './StatCard';
import type { Cliente } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, CartesianGrid, Cell } from 'recharts';
import { useState } from 'react';

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
  valorFaturasPagas: number;
  valorFaturasPendentes: number;
  valorFaturasAtrasadas: number;
  faturasPagasCount: number;
  faturasPendentesCount: number;
  faturasAtrasadasCount: number;
  clientes: Cliente[];
  mrrPerdido: number;
  taxaChurn: number;
  paretoData: Array<{ name: string; count: number; cumulativePercent: number }>;
  handleAbrirFichaCliente: (id: string) => void;
  getAvatarColor: (id: string) => string;
  getInitials: (nome: string) => string;
}

export function Dashboard(props: DashboardProps) {
  const [periodo, setPeriodo] = useState('trimestre');

  const data = [
    { name: 'Abril', Receitas: props.fluxoAbril.receita, Despesas: props.fluxoAbril.despesa },
    { name: 'Maio', Receitas: props.fluxoMaio.receita, Despesas: props.fluxoMaio.despesa },
    { name: 'Junho', Receitas: props.fluxoJunho.receita, Despesas: props.fluxoJunho.despesa },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '10px', borderRadius: '8px', background: 'rgba(10,11,13,0.9)' }}>
          <p style={{ margin: '0 0 5px 0', color: '#fff' }}>{label}</p>
          <p style={{ margin: 0, color: '#39FF14' }}>Receitas: R$ {payload[0].value.toFixed(2)}</p>
          <p style={{ margin: 0, color: '#FF003C' }}>Despesas: R$ {payload[1].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-wrapper">
      <div className="view-header">
        <h1>Dashboard Operacional</h1>
        <div className="header-actions">
           <select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              className="glass-panel"
              style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
           >
             <option value="hoje">Hoje</option>
             <option value="semana">Últimos 7 Dias</option>
             <option value="mes">Este Mês</option>
             <option value="trimestre">Último Trimestre</option>
           </select>
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
        <div className="card glass-panel" style={{ flex: 2 }}>
          <h3>Evolução Financeira (Receitas x Despesas)</h3>
          <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF003C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF003C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Receitas" stroke="#39FF14" fillOpacity={1} fill="url(#colorReceitas)" />
                <Area type="monotone" dataKey="Despesas" stroke="#FF003C" fillOpacity={1} fill="url(#colorDespesas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card glass-panel donut-chart-box" style={{ flex: 1 }}>
          <h3>Faturamento Mensal</h3>
          <div className="donut-chart-container">
            <svg className="donut-svg" width="150" height="150" viewBox="0 0 100 100">
              <circle className="donut-circle-bg" cx="50" cy="50" r="40" />
              <circle className="donut-circle-val3" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: props.offsetAtrasadas, stroke: 'var(--primary)', filter: 'drop-shadow(0 0 5px rgba(255, 0, 60, 0.5))' }} />
              <circle className="donut-circle-val2" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: props.offsetPendentes, stroke: 'var(--accent-yellow)', filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }} />
              <circle className="donut-circle-val1" cx="50" cy="50" r="40" strokeDasharray="251.2" style={{ strokeDashoffset: props.offsetPagas, stroke: 'var(--success)', filter: 'drop-shadow(0 0 5px rgba(57, 255, 20, 0.5))' }} />
            </svg>
            <div className="donut-text">
              <h3 style={{ fontSize: '1.25rem' }}>R$ {props.valorFaturasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <span>Recebido</span>
            </div>
          </div>
          <div className="donut-legend">
            <div className="legend-item">
              <div className="legend-label-group">
                <div className="legend-dot" style={{ backgroundColor: 'var(--success)' }}></div>
                <span>Recebidas (Pagas)</span>
              </div>
              <strong>R$ {props.valorFaturasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({props.faturasPagasCount})</strong>
            </div>
            <div className="legend-item">
              <div className="legend-label-group">
                <div className="legend-dot" style={{ backgroundColor: 'var(--accent-yellow)' }}></div>
                <span>Pendentes</span>
              </div>
              <strong>R$ {props.valorFaturasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({props.faturasPendentesCount})</strong>
            </div>
            <div className="legend-item">
              <div className="legend-label-group">
                <div className="legend-dot" style={{ backgroundColor: 'var(--primary)' }}></div>
                <span>Atrasadas</span>
              </div>
              <strong>R$ {props.valorFaturasAtrasadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({props.faturasAtrasadasCount})</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Inteligência de Retenção (Churn)</h2>
        <div className="dashboard-grid">
          <StatCard 
            title="Taxa de Churn Mensal"
            value={`${props.taxaChurn.toFixed(2)}%`}
            trendValue=""
            trendUp={false}
            iconColorClass="primary"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5.5"/><path d="M9 11l-4 4 4 4"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <StatCard 
            title="MRR Perdido (Evasão)"
            value={`R$ ${props.mrrPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            trendValue=""
            trendUp={false}
            iconColorClass="primary"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
        </div>

        <div className="activity-section" style={{ marginTop: '1.5rem' }}>
          <div className="card glass-panel" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Gráfico de Pareto: Motivos de Cancelamento (Regra 80/20)</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Identifique os 20% de motivos que causam 80% das saídas para focar esforços.
            </p>
            <div style={{ width: '100%', height: 350 }}>
              {props.paretoData && props.paretoData.length > 0 ? (
                <ResponsiveContainer>
                  <ComposedChart data={props.paretoData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" />
                    <YAxis yAxisId="left" stroke="#888" label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', fill: '#888' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#39FF14" label={{ value: '% Acumulado', angle: 90, position: 'insideRight', fill: '#39FF14' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,11,13,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar yAxisId="left" dataKey="count" name="Cancelamentos" fill="#FF003C" radius={[4, 4, 0, 0]}>
                      {props.paretoData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index < 2 ? '#FF003C' : '#FF6B6B'} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="% Acumulado" stroke="#39FF14" strokeWidth={3} dot={{ r: 4, fill: '#39FF14' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  Nenhum cancelamento registrado para gerar o gráfico.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
