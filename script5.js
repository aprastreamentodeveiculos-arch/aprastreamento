const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

c = c.replace(
  '<Topbar userName={userName} onLogout={handleLogout} />',
  `<Topbar 
          userName={userName} 
          onLogout={handleLogout} 
          clientes={clientes} 
          ordens={ordens} 
          handleAbrirFichaCliente={handleAbrirFichaCliente} 
          setCurrentPage={setCurrentPage} 
          toggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />`
);

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx updated for Topbar');
