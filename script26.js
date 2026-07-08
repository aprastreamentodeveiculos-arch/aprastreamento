const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

c = c.replace(
  /\(m\.valorPago != null \? m\.valorPago : m\.valor\)/g,
  "(m.valorPago > 0 || (m.valorPago === 0 && m.desconto === m.valor) ? m.valorPago : m.valor)"
);

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx Dashboard ZERO bug logic updated');
