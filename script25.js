const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

c = c.replace(
  /const lucroReal = mensalidades\.filter\(m => m\.status === 'PAGO'\)\.reduce\(\(acc, m\) => acc \+ m\.valor, 0\) - totalDespesas;/g,
  "const lucroReal = mensalidades.filter(m => m.status === 'PAGO' || m.status === 'PARCIAL').reduce((acc, m) => acc + (m.valorPago != null ? m.valorPago : m.valor), 0) - totalDespesas;"
);

c = c.replace(
  /const mensalidadesPagasCount = mensalidades\.filter\(m => m\.status === 'PAGO'\)\.length;/g,
  "const mensalidadesPagasCount = mensalidades.filter(m => m.status === 'PAGO' || m.status === 'PARCIAL').length;"
);

c = c.replace(
  /const valorMensalidadesPagas = mensalidades\.filter\(m => m\.status === 'PAGO'\)\.reduce\(\(acc, m\) => acc \+ m\.valor, 0\);/g,
  "const valorMensalidadesPagas = mensalidades.filter(m => m.status === 'PAGO' || m.status === 'PARCIAL').reduce((acc, m) => acc + (m.valorPago != null ? m.valorPago : m.valor), 0);"
);

// We also need to fix FluxoMensal graph (obterFluxoMes)
c = c.replace(
  /return m\.status === 'PAGO' && mesM === mesZeroIndexed && anoM === anoAtual;\n      \}\)\.reduce\(\(acc, m\) => acc \+ m\.valor, 0\);/g,
  "return (m.status === 'PAGO' || m.status === 'PARCIAL') && mesM === mesZeroIndexed && anoM === anoAtual;\n      }).reduce((acc, m) => acc + (m.valorPago != null ? m.valorPago : m.valor), 0);"
);

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx Dashboard logic updated');
