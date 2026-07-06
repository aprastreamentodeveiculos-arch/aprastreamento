const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const handleDeleteTecnicoBlock = `
  const handleDeleteTecnico = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este técnico? Isto apagará também seu acesso ao sistema.')) {
      try {
        await api.tecnicos.delete(id);
        carregarDados();
        alert('Técnico excluído com sucesso!');
      } catch (err: any) {
        alert('Erro ao excluir técnico: ' + err.message);
      }
    }
  };
`;

// Insert the functions near handleNovaOsSubmit
c = c.replace('const handleNovaOsSubmit = async (e: React.FormEvent) => {', handleDeleteTecnicoBlock + '\n  const handleNovaOsSubmit = async (e: React.FormEvent) => {');

// Add editTecnico state
c = c.replace('const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);', 'const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  const [editTecnico, setEditTecnico] = useState<Partial<Tecnico> | null>(null);');

// Replace standard create/edit behavior for tecnico modal
const editTecnicoSubmitBlock = `
  const handleTecnicoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editTecnico && editTecnico._id) {
        await api.tecnicos.update(editTecnico._id, newTecnico);
        alert('Técnico atualizado com sucesso!');
      } else {
        await api.tecnicos.create(newTecnico);
        alert('Técnico criado com sucesso!');
      }
      setModalNovoTecnicoOpen(false);
      setNewTecnico({ nome: '', telefone: '', email: '', endereco: '', ativo: true });
      setEditTecnico(null);
      carregarDados();
    } catch (err: any) {
      alert('Erro ao salvar técnico: ' + err.message);
    }
  };
`;
c = c.replace(/const handleNovoTecnicoSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?carregarDados\(\);\n    \} catch \(err: any\) \{\n      alert\('Erro ao criar t.*?: ' \+ err\.message\);\n    \}\n  \};/, editTecnicoSubmitBlock);
c = c.replace(/onSubmit=\{handleNovoTecnicoSubmit\}/g, 'onSubmit={handleTecnicoSubmit}');
c = c.replace(/<h2>Novo T.*?cnico<\/h2>/, '<h2>{editTecnico ? "Editar Técnico" : "Novo Técnico"}</h2>');

// Add Senha field in Novo Tecnico
const senhaField = `
              <div className="form-group">
                <label>Senha de Acesso (Opcional na edição)</label>
                <input type="password" value={newTecnico.senha || ''} onChange={(e) => setNewTecnico({...newTecnico, senha: e.target.value})} placeholder="Para login no sistema" />
              </div>
`;
c = c.replace(/<div className="form-group">\s*<label>Endere.*?<\/label>\s*<input type="text" value=\{newTecnico\.endereco \|\| ''\}.*?\/>\s*<\/div>/, `$&` + '\n' + senhaField);

// Modify the Tecnico table rows
const targetTr = `<td>{t.telefone || 'N/A'}</td>
                        <td>`;
const replacementTr = `<td>{t.telefone || 'N/A'}</td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '5px' }} onClick={() => { setEditTecnico(t); setNewTecnico(t as any); setModalNovoTecnicoOpen(true); }}>Editar</button>
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteTecnico(t._id)}>Excluir</button>
                        </td>
                        <td style={{ display: 'none' }}>`;
c = c.replace(targetTr, replacementTr);

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx updated for Tecnico CRUD');
