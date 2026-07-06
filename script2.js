const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

c = c.replace("import { Dashboard } from './components/dashboard/Dashboard';", "import { Dashboard } from './components/dashboard/Dashboard';\nimport { Topbar } from './components/layout/Topbar';");

const before = c.indexOf('{/* Barra superior de simulação e logout */}');
const after = c.indexOf('{/* --- PÁGINA: DASHBOARD ADMIN --- */}');

if (before !== -1 && after !== -1) {
  c = c.substring(0, before) + '<Topbar userName={userName} onLogout={handleLogout} />\n\n        ' + c.substring(after);
  fs.writeFileSync('frontend/src/App.tsx', c);
  console.log('Replaced topbar');
} else {
  console.log('Not found');
}
