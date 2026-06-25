import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  userRole: 'admin' | 'tecnico';
  userName: string;
  selectedOSId?: string;
  onOpenSupport: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  userRole,
  userName,
  selectedOSId = 'avulsa',
  onOpenSupport,
  isOpen,
  onClose,
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Botão de Fechar Mobile */}
      <button className="close-sidebar-btn" onClick={onClose} aria-label="Fechar menu">
        ✕
      </button>

      {/* Logo Oficial AP Rastro em SVG */}
      <div className="sidebar-logo">
        <svg width="45" height="38" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ondas concêntricas de sinal (Brancas) */}
          <path d="M12 40 C17 25, 32 15, 48 15" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round"/>
          <path d="M22 50 C28 37, 40 30, 54 30" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round"/>
          <circle cx="38" cy="58" r="7" fill="#FFFFFF"/>
          
          {/* Caixa Vermelha do AP */}
          <rect x="30" y="42" width="85" height="52" rx="10" fill="#FF003C"/>
          
          {/* Letra A (Preta) */}
          <path d="M42 84 L57 52 L65 52 L80 84 L72 84 L69 76 L53 76 L50 84 Z M56 68 L66 68 L61 58 Z" fill="#000000"/>
          
          {/* Letra P (Preta) */}
          <path d="M80 52 L98 52 C103 52, 107 55, 107 59 C107 63, 103 66, 98 66 L87 66 L87 84 L80 84 Z M87 58 L87 61 L96 61 C98 61, 99 60, 99 59 C99 58, 98 58, 96 58 Z" fill="#000000"/>
        </svg>
        <div className="sidebar-logo-text">
          <h2>AP RASTRO</h2>
          <span>Rastreamento</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {userRole === 'admin' ? (
          <>
            <button
              onClick={() => {
                setCurrentPage('dashboard');
                onClose();
              }}
              className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => {
                setCurrentPage('clientes');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('clientes') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Clientes
            </button>

            <button
              onClick={() => {
                setCurrentPage('tecnicos');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('tecnicos') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Técnicos
            </button>

            <button
              onClick={() => {
                setCurrentPage('estoque');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('estoque') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Estoque
            </button>

            <button
              onClick={() => {
                setCurrentPage('ordens');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('ordens') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Ordens de Serviço
            </button>

            <button
              onClick={() => {
                setCurrentPage('financeiro');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('financeiro') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Mensalidades
            </button>

            <button
              onClick={() => {
                setCurrentPage('caixa');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('caixa') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Fluxo de Caixa
            </button>

            <button
              onClick={() => {
                setCurrentPage('historico');
                onClose();
              }}
              className={`sidebar-item ${currentPage.startsWith('historico') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Histórico Cruzado
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setCurrentPage('tecnico-caixa');
                onClose();
              }}
              className={`sidebar-item ${currentPage === 'tecnico-caixa' || (currentPage === 'ordem-tecnico' && selectedOSId !== 'avulsa') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Caixa de Entrada
            </button>

            <button
              onClick={() => {
                setCurrentPage('ordem-tecnico');
                onClose();
              }}
              className={`sidebar-item ${currentPage === 'ordem-tecnico' && selectedOSId === 'avulsa' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nova O.S. Avulsa
            </button>
          </>
        )}
      </nav>

      {/* Card Promocional "Precisa de ajuda?" (Semelhante ao Mockup) */}
      <div className="sidebar-help-card">
        <h4>Central de Suporte</h4>
        <p>Está com alguma dúvida sobre a instalação ou faturamento?</p>
        <button onClick={() => {
          onOpenSupport();
          onClose();
        }}>Suporte Online</button>
      </div>

      <div className="sidebar-footer">
        <div className="profile-container">
          <div className="avatar">{getInitials(userName)}</div>
          <div className="profile-info">
            <span className="profile-name">{userName}</span>
            <span className="profile-role">
              {userRole === 'admin' ? 'Administrador' : 'Técnico Instalador'}
            </span>
          </div>
        </div>
        <button className="logout-btn" title="Sair do sistema" onClick={() => alert('Simulação de logout...')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
