const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// 1. Add "Troco" feedback
const partialPaymentCode = `                  </div>
                )}

                {checkoutData.valorPago > (Number(checkoutMensalidadeId.valor) + checkoutData.acrescimo - checkoutData.desconto) && (
                  <div style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-blue)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-main)' }}>Troco a devolver:</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>R$ {(checkoutData.valorPago - (Number(checkoutMensalidadeId.valor) + checkoutData.acrescimo - checkoutData.desconto)).toFixed(2)}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>`;
c = c.replace(/                  <\/div>\n                \)}\n\n                <button type="submit" className="btn btn-primary"/g, partialPaymentCode);

// 2. Fix the table rendering in Panorama
const renderValorCode = `                            <td>
                              <strong>R$ {((m.status === 'PAGO' || m.status === 'PARCIAL') && m.valorPago != null ? m.valorPago : m.valor).toFixed(2)}</strong>
                              {(m.status === 'PAGO' || m.status === 'PARCIAL') && m.desconto > 0 && <div style={{fontSize: '0.75rem', color: 'var(--success)'}}>- R$ {Number(m.desconto).toFixed(2)} (desc)</div>}
                              {(m.status === 'PAGO' || m.status === 'PARCIAL') && m.acrescimo > 0 && <div style={{fontSize: '0.75rem', color: 'var(--danger)'}}>+ R$ {Number(m.acrescimo).toFixed(2)} (juros)</div>}
                            </td>`;

c = c.replace(/                            <td><strong>R\$ \{m\.valor\.toFixed\(2\)\}<\/strong><\/td>/g, renderValorCode);

// 3. Fix the table rendering in Financeiro
const renderValorCode2 = `                          <td>
                            <strong>R$ {((m.status === 'PAGO' || m.status === 'PARCIAL') && m.valorPago != null ? m.valorPago : m.valor).toFixed(2)}</strong>
                            {(m.status === 'PAGO' || m.status === 'PARCIAL') && m.desconto > 0 && <div style={{fontSize: '0.75rem', color: 'var(--success)'}}>- R$ {Number(m.desconto).toFixed(2)} (desc)</div>}
                            {(m.status === 'PAGO' || m.status === 'PARCIAL') && m.acrescimo > 0 && <div style={{fontSize: '0.75rem', color: 'var(--danger)'}}>+ R$ {Number(m.acrescimo).toFixed(2)} (juros)</div>}
                          </td>`;

c = c.replace(/                          <td><strong>R\$ \{m\.valor\.toFixed\(2\)\}<\/strong><\/td>/g, renderValorCode2);

fs.writeFileSync('frontend/src/App.tsx', c);
console.log('App.tsx updated');
