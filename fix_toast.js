const fs = require('fs');
let content = fs.readFileSync('c:/Users/Lameira/Desktop/AP RASTRO/frontend/src/App.tsx', 'utf-8');
content = content.replace(/toast\.error\(\)/g, "toast.error('Ocorreu um erro')");
content = content.replace(/toast\.success\(\)/g, "toast.success('Sucesso')");
content = content.replace(/toast\.error\(.*favor.*\)/gi, "toast.error('Preencha os campos')");
fs.writeFileSync('c:/Users/Lameira/Desktop/AP RASTRO/frontend/src/App.tsx', content);
console.log('App.tsx fixed');
