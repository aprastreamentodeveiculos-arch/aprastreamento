const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const target = `<tr key={c._id}>
                        <td>
                          <div className="customer-cell" style={{ cursor: 'pointer' }} onClick={() => handleAbrirFichaCliente(c._id)}>
                            <div className={\`customer-avatar \${getAvatarColor(c._id)}\`}>
                              {getInitials(c.nome)}
                            </div>
                            <div className="customer-info">
                              <span style={{ color: 'var(--primary-hover)', textDecoration: 'underline' }}>{c.nome}</span>
                              <small>{c.email}</small>
                            </div>
                          </div>
                        </td>`;

const replacement = `<tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => handleAbrirFichaCliente(c._id)} className="table-row-clickable">
                        <td>
                          <div className="customer-cell">
                            <div className={\`customer-avatar \${getAvatarColor(c._id)}\`}>
                              {getInitials(c.nome)}
                            </div>
                            <div className="customer-info">
                              <span style={{ color: 'var(--text-main)' }}>{c.nome}</span>
                              <small>{c.email}</small>
                            </div>
                          </div>
                        </td>`;

c = c.replace(target, replacement);
fs.writeFileSync('frontend/src/App.tsx', c);
console.log('Replaced successfully');
