const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

c = c.replace(/m\.desconto > 0/g, '(m.desconto || 0) > 0');
c = c.replace(/m\.acrescimo > 0/g, '(m.acrescimo || 0) > 0');

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx updated');
