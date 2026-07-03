import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const GestaoUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<'admin' | 'tecnico'>('tecnico');
  const [tecnicoId, setTecnicoId] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [users, tecs] = await Promise.all([
        api.usuarios.list(),
        api.tecnicos.list()
      ]);
      setUsuarios(users);
      setTecnicos(tecs);
    } catch (error) {
      console.error('Erro ao carregar usuários', error);
      alert('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user: any = null) => {
    if (user) {
      setEditUser(user);
      setNome(user.nome);
      setEmail(user.email);
      setSenha('');
      setRole(user.role);
      setTecnicoId(user.tecnicoId || '');
      setAtivo(user.ativo);
    } else {
      setEditUser(null);
      setNome('');
      setEmail('');
      setSenha('');
      setRole('tecnico');
      setTecnicoId('');
      setTelefone('');
      setAtivo(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { nome, email, senha, telefone, role, tecnicoId, ativo };
      if (editUser) {
        await api.usuarios.update(editUser._id, payload);
      } else {
        await api.usuarios.create(payload);
      }
      setShowModal(false);
      carregarDados();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este usuário?')) {
      try {
        await api.usuarios.delete(id);
        carregarDados();
      } catch (error: any) {
        alert(error.message || 'Erro ao excluir usuário');
      }
    }
  };

  if (loading) return <div className="loading">Carregando usuários...</div>;

  return (
    <div className="painel-clientes">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestão de Usuários</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>+ Novo Usuário</button>
      </div>

      <div className="table-container">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil (Role)</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u._id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.ativo ? 'bg-success' : 'bg-danger'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '5px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => openModal(u)}>
                    Editar
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDelete(u._id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>Nenhum usuário encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="input" placeholder="Ex: João da Silva" />
                </div>
                
                <div className="form-group">
                  <label>E-mail (Login)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="Ex: joao@aprastro.com" />
                </div>

                <div className="form-group">
                  <label>{editUser ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso'}</label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required={!editUser} className="input" placeholder="••••••••" />
                </div>

                <div className="form-group">
                  <label>Perfil de Acesso (Role)</label>
                  <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'tecnico')} className="input">
                    <option value="tecnico">Técnico (Acesso Restrito)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>

                {role === 'tecnico' && (
                  <div style={{ background: '#0A0B0D', padding: '1rem', borderRadius: '8px', border: '1px solid #1E2026', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ color: '#FF003C' }}>Vincular a qual Técnico da Frota?</label>
                      <select value={tecnicoId} onChange={e => setTecnicoId(e.target.value)} className="input">
                        <option value="">&lt; Criar Novo Técnico Automaticamente &gt;</option>
                        {tecnicos.map(t => (
                          <option key={t._id} value={t._id}>{t.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    {!tecnicoId && !editUser && (
                      <div className="form-group">
                        <label>Telefone do Novo Técnico (Opcional)</label>
                        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="input" placeholder="(11) 99999-9999" />
                      </div>
                    )}
                  </div>
                )}

                {editUser && (
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', background: '#0A0B0D', padding: '1rem', borderRadius: '8px', border: '1px solid #1E2026' }}>
                    <div className="toggle-switch">
                      <input type="checkbox" id="ativo" checked={ativo} onChange={e => setAtivo(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#FF003C' }} />
                    </div>
                    <label htmlFor="ativo" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, color: ativo ? '#39FF14' : '#FF003C' }}>
                      {ativo ? 'Usuário Ativo (Pode fazer login)' : 'Usuário Inativo (Bloqueado)'}
                    </label>
                  </div>
                )}

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #1E2026', paddingTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar Usuário</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
