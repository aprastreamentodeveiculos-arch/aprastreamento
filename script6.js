const fs = require('fs');
let c = fs.readFileSync('frontend/src/services/api.ts', 'utf8');

c = c.replace(
  `create: (data: Partial<Tecnico>): Promise<Tecnico> => 
      request('/tecnicos', { method: 'POST', body: JSON.stringify(data) })
  },`,
  `create: (data: Partial<Tecnico>): Promise<Tecnico> => 
      request('/tecnicos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Tecnico>): Promise<Tecnico> =>
      request('/tecnicos/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      request('/tecnicos/' + id, { method: 'DELETE' })
  },`
);

fs.writeFileSync('frontend/src/services/api.ts', c);
console.log('Updated api.ts');
