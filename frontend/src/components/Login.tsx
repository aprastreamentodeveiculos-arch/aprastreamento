import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.auth.login({ email, senha });
      if (response.token) {
        onLogin(response.token, response.usuario);
      } else {
        setError('Erro desconhecido ao realizar login.');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas ou erro de servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">AP</div>
          <h2>AP RASTRO</h2>
          <p>Gestão Inteligente de Frota</p>
        </div>

        {error && <div className="login-error slide-in">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@aprastro.com"
              required
              className="input-login"
            />
          </div>

          <div className="form-group">
            <label>Senha de Acesso</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="input-login"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Autenticando...' : 'Acessar Painel'}
          </button>
        </form>

        <div className="login-footer">
          <p>Uso exclusivo para colaboradores autorizados.</p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
          animation: pulse 10s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .login-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 3rem 2.5rem;
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-placeholder {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }

        .login-header h2 {
          color: #f8fafc;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          letter-spacing: -0.025em;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.95rem;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group label {
          display: block;
          color: #cbd5e1;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .input-login {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-login:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          background: rgba(15, 23, 42, 0.8);
        }

        .input-login::placeholder {
          color: #475569;
        }

        .btn-login {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
        }

        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }

        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .slide-in {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .login-footer p {
          color: #64748b;
          font-size: 0.8rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
};
