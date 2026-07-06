import { useState } from 'react';

interface TopbarProps {
  userName: string;
  onLogout: () => void;
}

export function Topbar({ userName, onLogout }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="topbar">
      <div className={`search-container glass-panel ${searchFocused ? 'focused' : ''}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder='Try searching "insights"' 
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" title="Menu" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
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

        <button className="btn btn-primary circular-btn" title="Add New">
          +
        </button>
      </div>
    </header>
  );
}
