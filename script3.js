const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

c = c.replace("import { Dashboard } from './components/dashboard/Dashboard';", "import { Dashboard } from './components/dashboard/Dashboard';\nimport { Topbar } from './components/layout/Topbar';");
c = c.replace(/userName=\{userName\}\s*/, '');

const startOs = c.indexOf('onOpenSupport={() => {');
if (startOs !== -1) {
  const endOs = c.indexOf('}}', startOs) + 2;
  c = c.substring(0, startOs) + c.substring(endOs);
}

const before = c.indexOf('{/* Barra superior de simulação e logout */}');
const after = c.indexOf('{/* --- PÁGINA: DASHBOARD ADMIN --- */}');

if (before !== -1 && after !== -1) {
  c = c.substring(0, before) + '<Topbar userName={userName} onLogout={handleLogout} />\n\n        ' + c.substring(after);
}

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('Successfully patched App.tsx');
