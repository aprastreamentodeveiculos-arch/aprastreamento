const fs = require('fs');
let c = fs.readFileSync('frontend/src/services/api.ts', 'utf8');

c = c.replace(
  `createDespesa: (data: {
      descricao: string;
      valor: number;
      categoriaId: string;
      data?: string;
    }): Promise<Despesa> => request('/caixa/despesas', { method: 'POST', body: JSON.stringify(data) }),
  }
};`,
  `createDespesa: (data: {
      descricao: string;
      valor: number;
      categoriaId: string;
      data?: string;
    }): Promise<Despesa> => request('/caixa/despesas', { method: 'POST', body: JSON.stringify(data) }),
    updateDespesa: (id: string, data: any): Promise<Despesa> => request('/caixa/despesas/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDespesa: (id: string, data: { editObs: string }): Promise<void> => request('/caixa/despesas/' + id, { method: 'DELETE', body: JSON.stringify(data) })
  }
};`
);

fs.writeFileSync('frontend/src/services/api.ts', c);
console.log('Updated api.ts for Caixa');
