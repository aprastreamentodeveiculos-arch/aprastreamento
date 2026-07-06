import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  userRole: 'admin' | 'tecnico';
  selectedOSId?: string;
  isOpen: boolean;
  isDesktopExpanded?: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  userRole,
  selectedOSId = 'avulsa',
  isOpen,
  onClose,
}) => {

  return (
    <aside className={`sidebar glass-panel ${!isDesktopExpanded ? 'narrow' : ''} ${isOpen ? 'open' : ''}`}>
      {/* Botão de Fechar Mobile */}
      <button className="close-sidebar-btn" onClick={onClose} aria-label="Fechar menu" title="Fechar">
        ✕
      </button>

      {/* Logo Oficial AP Rastro em SVG Simplificado para Sidebar Estreita */}
      <div className="sidebar-logo">
        <svg width="35" height="30" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 40 C17 25, 32 15, 48 15" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round"/>
          <path d="M22 50 C28 37, 40 30, 54 30" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round"/>
          <circle cx="38" cy="58" r="7" fill="#FFFFFF"/>
          <rect x="30" y="42" width="85" height="52" rx="10" fill="var(--primary)"/>
          <path d="M42 84 L57 52 L65 52 L80 84 L72 84 L69 76 L53 76 L50 84 Z M56 68 L66 68 L61 58 Z" fill="#000000"/>
          <path d="M80 52 L98 52 C103 52, 107 55, 107 59 C107 63, 103 66, 98 66 L87 66 L87 84 L80 84 Z M87 58 L87 61 L96 61 C98 61, 99 60, 99 59 C99 58, 98 58, 96 58 Z" fill="#000000"/>
        </svg>
              <span className="sidebar-label">Fechar</span>
      </div>

      <nav className="sidebar-menu">
        {userRole === 'admin' ? (
          <>
            <button
              title="Dashboard"
              onClick={() => { setCurrentPage('dashboard'); onClose(); }}
              className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span className="sidebar-label">Dashboard</span>
              
            </button>

            <button
              title="Gestão de Usuários"
              onClick={() => { setCurrentPage('usuarios'); onClose(); }}
              className={`sidebar-item ${currentPage === 'usuarios' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="11" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="sidebar-label">Gestão de Usuários</span>
            </button>

            <button
              title="Clientes"
              onClick={() => { setCurrentPage('clientes'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('clientes') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="sidebar-label">Clientes</span>
            </button>

            <button
              title="Técnicos"
              onClick={() => { setCurrentPage('tecnicos'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('tecnicos') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="sidebar-label">Técnicos</span>
            </button>

            <button
              title="Estoque"
              onClick={() => { setCurrentPage('estoque'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('estoque') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span className="sidebar-label">Estoque</span>
            </button>

            <button
              title="Ordens de Serviço"
              onClick={() => { setCurrentPage('ordens'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('ordens') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="sidebar-label">Ordens de Serviço</span>
            </button>

            <button
              title="Mensalidades"
              onClick={() => { setCurrentPage('financeiro'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('financeiro') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="sidebar-label">Mensalidades</span>
            </button>

            <button
              title="Fluxo de Caixa"
              onClick={() => { setCurrentPage('caixa'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('caixa') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className="sidebar-label">Fluxo de Caixa</span>
            </button>

            <button
              title="Histórico Cruzado"
              onClick={() => { setCurrentPage('historico'); onClose(); }}
              className={`sidebar-item ${currentPage.startsWith('historico') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="sidebar-label">Histórico Cruzado</span>
            </button>
          </>
        ) : (
          <>
            <button
              title="Caixa de Entrada"
              onClick={() => { setCurrentPage('tecnico-caixa'); onClose(); }}
              className={`sidebar-item ${currentPage === 'tecnico-caixa' || (currentPage === 'ordem-tecnico' && selectedOSId !== 'avulsa') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span className="sidebar-label">Caixa de Entrada</span>
            </button>

            <button
              title="Nova O.S. Avulsa"
              onClick={() => { setCurrentPage('ordem-tecnico'); onClose(); }}
              className={`sidebar-item ${currentPage === 'ordem-tecnico' && selectedOSId === 'avulsa' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="sidebar-label">Nova O.S. Avulsa</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
};
