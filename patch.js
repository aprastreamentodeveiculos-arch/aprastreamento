const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'frontend/src/App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. maskCpfCnpj
content = content.replace(/setNewCliente\(\{ \.\.\.newCliente, documento: e\.target\.value \}\)/g, 'setNewCliente({ ...newCliente, documento: maskCpfCnpj(e.target.value) })');
content = content.replace(/setEditCliente\(\{\.\.\.editCliente, documento: e\.target\.value\}\)/g, 'setEditCliente({...editCliente, documento: maskCpfCnpj(e.target.value)})');

// 2. maskTelefone
content = content.replace(/setNewCliente\(\{ \.\.\.newCliente, whatsapp: e\.target\.value \}\)/g, 'setNewCliente({ ...newCliente, whatsapp: maskTelefone(e.target.value) })');
content = content.replace(/setEditCliente\(\{\.\.\.editCliente, whatsapp: e\.target\.value\}\)/g, 'setEditCliente({...editCliente, whatsapp: maskTelefone(e.target.value)})');

// 3. maskPlaca
content = content.replace(/setNewVeiculo\(\{\.\.\.newVeiculo, placa: e\.target\.value\}\)/g, 'setNewVeiculo({...newVeiculo, placa: maskPlaca(e.target.value)})');
content = content.replace(/setEditVeiculo\(\{\.\.\.editVeiculo, placa: e\.target\.value\}\)/g, 'setEditVeiculo({...editVeiculo, placa: maskPlaca(e.target.value)})');
content = content.replace(/setVeiculosEmLote\(\(prev\) => prev\.map\(\(v, i\) => i === index \? \{ \.\.\.v, placa: e\.target\.value \} : v\)\)/g, 'setVeiculosEmLote((prev) => prev.map((v, i) => i === index ? { ...v, placa: maskPlaca(e.target.value) } : v))');

// 4. Update EditVeiculo Rastreador
// find handleEditVeiculoSubmit
const submitRegex = /const handleEditVeiculoSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?cor: editVeiculo\.cor,\s*ano: editVeiculo\.ano\s*\}\);/m;
content = content.replace(submitRegex, `const handleEditVeiculoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVeiculo) return;
    try {
      await api.veiculos.update(editVeiculo._id, {
        placa: editVeiculo.placa,
        marca: editVeiculo.marca,
        modelo: editVeiculo.modelo,
        cor: editVeiculo.cor,
        ano: editVeiculo.ano,
        rastreadorId: editVeiculo.rastreadorId
      });`);

// find EditVeiculo Modal inputs
const formBodyRegex = /<form onSubmit=\{handleEditVeiculoSubmit\} className="modal-body"[^>]*>([\s\S]*?)<button type="submit"/m;
const match = content.match(formBodyRegex);
if (match) {
  const newInputs = match[1] + `
              <div className="form-group">
                <label>Rastreador Instalado</label>
                <select 
                  value={editVeiculo.rastreadorId || ''} 
                  onChange={(e) => setEditVeiculo({...editVeiculo, rastreadorId: e.target.value})}
                  className="input"
                >
                  <option value="">Nenhum</option>
                  {equipamentos
                    .filter(eq => eq.status === 'ESTOQUE' || eq.status === 'COM_TECNICO' || eq._id === editVeiculo.rastreadorId)
                    .map(eq => (
                      <option key={eq._id} value={eq._id}>
                        {eq.identificador} {eq._id === editVeiculo.rastreadorId ? '(Atual)' : ''}
                      </option>
                    ))}
                </select>
              </div>
              {editVeiculo.rastreadorId && (
                <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {(() => {
                    const eq = equipamentos.find(e => e._id === editVeiculo.rastreadorId);
                    if (eq) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><strong>ICCID:</strong> <span style={{color: 'var(--primary)'}}>{eq.iccid || 'Não informado'}</span></div>
                          <div><strong>Linha M2M:</strong> <span style={{color: 'var(--primary)'}}>{eq.numeroLinha || 'Não informado'}</span></div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
              `;
  content = content.replace(match[1], newInputs);
}

// Update the onClick for the Edit button in the Ficha do Cliente
content = content.replace(/onClick=\{\(\) => setEditVeiculo\(v\)\}/g, "onClick={() => setEditVeiculo({...v, rastreadorId: instalacaoAtiva?.rastreadorId?._id || ''})}");

fs.writeFileSync(appPath, content);
console.log('App.tsx patched successfully');
