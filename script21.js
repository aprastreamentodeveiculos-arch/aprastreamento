const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/Sidebar.tsx', 'utf8');

c = c.replace(/<span className="sidebar-label">.*?<\/span>/g, '');

c = c.replace(/title="(.*?)"([\s\S]*?)<\/svg>/g, (match, p1, p2) => {
  if (p1 === 'Dashboard' && c.includes('<span className="sidebar-label">Dashboard</span>')) {
    // skip if already there or we just removed it? Wait, we removed them all.
  }
  return `title="${p1}"${p2}</svg>\n              <span className="sidebar-label">${p1}</span>`;
});

fs.writeFileSync('frontend/src/components/Sidebar.tsx', c);
console.log('Added labels');
