const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const despesaHandlers = `
  const handleDeleteDespesa = async (id: string) => {
    const editObs = prompt('Motivo da exclusão (obrigatório para auditoria):');
    if (editObs !== null) {
      if (editObs.trim() === '') {
        alert('O motivo é obrigatório.');
        return;
      }
      try {
        await api.caixa.deleteDespesa(id, { editObs });
        carregarDespesas();
        carregarDashboard();
        alert('Despesa movida para a lixeira (retida por 30 dias).');
      } catch (err: any) {
        alert('Erro ao excluir despesa: ' + err.message);
      }
    }
  };
`;

c = c.replace('const handleLancarDespesa = async (e: React.FormEvent) => {', despesaHandlers + '\n  const handleLancarDespesa = async (e: React.FormEvent) => {');

// Edit the Despesas table headers
const targetHeaders = `<th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>`;
const repHeaders = `<th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                      <th>Ações</th>`;
c = c.replace(targetHeaders, repHeaders);

// Edit the Despesas table rows
const targetRows = `<td style={{ color: 'var(--danger)', fontWeight: '600' }}>- R$ {d.valor.toFixed(2)}</td>
                      </tr>`;
const repRows = `<td style={{ color: 'var(--danger)', fontWeight: '600' }}>- R$ {d.valor.toFixed(2)}</td>
                        <td>
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteDespesa(d._id)}>Excluir</button>
                        </td>
                      </tr>`;
c = c.replace(targetRows, repRows);

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx updated for Caixa CRUD');
