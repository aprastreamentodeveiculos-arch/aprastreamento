import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import clienteRoutes from './modules/clientes/cliente.routes';
import tecnicoRoutes from './modules/tecnicos/tecnico.routes';
import equipamentoRoutes from './modules/equipamentos/equipamento.routes';
import ordemRoutes from './modules/ordens/ordem.routes';
import caixaRoutes from './modules/caixa/caixa.routes';
import historicoRoutes from './modules/historico/historico.routes';
import financeiroRoutes from './modules/financeiro/financeiro.routes';
import seedRoutes from './modules/seed/seed.routes';
import uploadRoutes from './modules/upload/upload.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import planoRoutes from './modules/planos/plano.routes';


const app: Application = express();

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://aprastreamento.vercel.app',
  (process.env.FRONTEND_URL || '').replace(/\/$/, '')
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (ex: Render health-checks, apps mobile)
    if (!origin) {
      callback(null, true);
      return;
    }

    const sanitizedOrigin = origin.replace(/\/$/, '');
    const isVercelSubdomain = sanitizedOrigin.endsWith('.vercel.app') && sanitizedOrigin.includes('aprastreamento');
    const isAllowed = allowedOrigins.map(o => o.replace(/\/$/, '')).includes(sanitizedOrigin) || isVercelSubdomain;

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} não autorizada por política sanitizada.`));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir a pasta de uploads estaticamente de forma pública
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api/clientes', clienteRoutes);
app.use('/api/tecnicos', tecnicoRoutes);
app.use('/api/equipamentos', equipamentoRoutes);
app.use('/api/ordens', ordemRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/planos', planoRoutes);


// Rota de Health-Check simples
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'AP RASTRO API está ativa e operacional.',
    timestamp: new Date()
  });
});

export default app;
