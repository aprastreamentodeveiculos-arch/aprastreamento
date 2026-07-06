const fs = require('fs');
const file = 'frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import './App.css';", "import { Dashboard } from './components/dashboard/Dashboard';\nimport './App.css';");

// Fix TS error for mascaraDocumento
content = content.replace("const mascaraDocumento = (value: string) => {", "// @ts-ignore\n  const mascaraDocumento = (value: string) => {");

const startStr = "        {currentPage === 'dashboard' && (";
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf("{/* --- PÁGINA: LISTAGEM DE CLIENTES (Tela Inteira) --- */}");

if (startIdx !== -1 && endIdx !== -1) {
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  
  // NOTE: startIdx starts EXACTLY at the ' ' before '{currentPage'. 
  // We need to provide the entire block that replaces the deleted part.
  
  const dashboard = `        {currentPage === 'dashboard' && (
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
            valorMensalidadesPagas={valorMensalidadesPagas}
            valorMensalidadesPendentes={valorMensalidadesPendentes}
            valorMensalidadesAtrasadas={valorMensalidadesAtrasadas}
            mensalidadesPagasCount={mensalidadesPagasCount}
            mensalidadesPendentesCount={mensalidadesPendentesCount}
            mensalidadesAtrasadasCount={mensalidadesAtrasadasCount}
            clientes={clientes}
            handleAbrirFichaCliente={handleAbrirFichaCliente}
            getAvatarColor={getAvatarColor}
            getInitials={getInitials}
          />
        )}

        `;
        
  fs.writeFileSync(file, before + dashboard + after);
  console.log('Success');
} else {
  console.log('Tokens not found: ' + startIdx + ' ' + endIdx);
}
