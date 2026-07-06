const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/layout/Topbar.tsx', 'utf8');

c = c.replace(/c\.veiculos && c\.veiculos\.length > 0/g, '(c as any).veiculos && (c as any).veiculos.length > 0');
c = c.replace(/c\.veiculos\.forEach/g, '(c as any).veiculos.forEach');
c = c.replace(/o\.numeroOS/g, '(o as any).numeroOS');

fs.writeFileSync('frontend/src/components/layout/Topbar.tsx', c);
console.log('Fixed Topbar TS errors');
