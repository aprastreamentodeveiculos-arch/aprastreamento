import { useState, useRef, useEffect } from 'react';
import type { Cliente, OrdemServico } from '../../services/api';

interface TopbarProps {
  userName: string;
  onLogout: () => void;
  clientes: Cliente[];
  ordens: OrdemServico[];
  handleAbrirFichaCliente: (id: string) => void;
  setCurrentPage: (page: string) => void;
  toggleSidebar: () => void;
}

export function Topbar({ userName, onLogout, clientes, ordens, handleAbrirFichaCliente, setCurrentPage, toggleSidebar }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const addNewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (addNewRef.current && !addNewRef.current.contains(event.target as Node)) {
        setShowAddNew(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Search Logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.toLowerCase();
    const results: { type: string, label: string, sublabel?: string, action: () => void }[] = [];

    // Search Clientes
    clientes.forEach(c => {
      if (c.nome.toLowerCase().includes(term) || c.documento.toLowerCase().includes(term) || (c.email && c.email.toLowerCase().includes(term))) {
        results.push({
          type: 'Cliente',
          label: c.nome,
          sublabel: c.documento,
          action: () => { handleAbrirFichaCliente(c._id); setSearchQuery(''); setSearchFocused(false); }
        });
      }
      // Search Veiculos inside Clientes
      if ((c as any).veiculos && (c as any).veiculos.length > 0) {
        (c as any).veiculos.forEach((v: any) => {
          if (v.placa && v.placa.toLowerCase().includes(term)) {
            results.push({
              type: 'Veículo',
              label: v.placa,
              sublabel: `Cliente: ${c.nome}`,
              action: () => { handleAbrirFichaCliente(c._id); setSearchQuery(''); setSearchFocused(false); }
            });
          }
        });
      }
    });

    // Search Ordens
    ordens.forEach(o => {
      const numOS = ((o as any).numeroOS || '').toString().toLowerCase();
      if (numOS.includes(term) || o.status.toLowerCase().includes(term)) {
        results.push({
          type: 'Ordem de Serviço',
          label: `O.S #${(o as any).numeroOS || 'N/A'}`,
          sublabel: `Status: ${o.status}`,
          action: () => { setCurrentPage('ordens'); setSearchQuery(''); setSearchFocused(false); }
        });
      }
    });

    return results.slice(0, 8); // Max 8 results
  };

  const searchResults = getSearchResults();

  return (
    <header className="topbar" style={{ position: 'relative', zIndex: 50 }}>
      <div 
        ref={searchRef}
        className={`search-container glass-panel ${searchFocused ? 'focused' : ''}`}
        style={{ position: 'relative' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder='Pesquisar clientes, placas, O.S...' 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
        />
        
        {/* Dropdown de Resultados da Pesquisa */}
        {searchFocused && searchQuery && (
          <div className="search-dropdown glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', borderRadius: '12px', background: 'rgba(10, 11, 13, 0.95)', border: '1px solid var(--border-color)', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0.5rem' }}>
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <div key={i} onClick={res.action} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} className="search-result-item">
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}><strong>{res.type}:</strong> {res.label}</span>
                  {res.sublabel && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.sublabel}</span>}
                </div>
              ))
            ) : (
              <div style={{ padding: '10px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Nenhum resultado encontrado.</div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" title="Alternar Menu" onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <div className="user-profile" onClick={onLogout} title="Clique para sair" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="avatar" style={{ background: 'var(--primary-gradient)', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
             {userName.substring(0, 2).toUpperCase()}
           </div>
        </div>

        <div ref={addNewRef} style={{ position: 'relative' }}>
          <button className="btn btn-primary circular-btn" title="Add New" onClick={() => setShowAddNew(!showAddNew)}>
            +
          </button>
          {showAddNew && (
            <div className="add-new-dropdown glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', borderRadius: '12px', background: 'rgba(10, 11, 13, 0.95)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '0.5rem', minWidth: '180px' }}>
              <button className="btn btn-secondary" style={{ marginBottom: '0.5rem', textAlign: 'left', padding: '8px 12px' }} onClick={() => { setCurrentPage('clientes'); setShowAddNew(false); }}>➕ Novo Cliente</button>
              <button className="btn btn-secondary" style={{ marginBottom: '0.5rem', textAlign: 'left', padding: '8px 12px' }} onClick={() => { setCurrentPage('ordens'); setShowAddNew(false); }}>➕ Nova O.S.</button>
              <button className="btn btn-secondary" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => { setCurrentPage('caixa-cadastro'); setShowAddNew(false); }}>➕ Lançar Despesa</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
