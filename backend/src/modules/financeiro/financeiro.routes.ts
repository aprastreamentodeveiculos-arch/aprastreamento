import { Router } from 'express';
import { listMensalidades, baixarMensalidadeManual, rodarFaturamentoAutomatico } from './financeiro.controller';

const router = Router();

router.get('/', listMensalidades);
router.put('/:id/baixar', baixarMensalidadeManual);
router.post('/faturamento-cron', rodarFaturamentoAutomatico);

export default router;
