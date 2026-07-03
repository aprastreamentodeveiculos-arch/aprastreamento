import { Router } from 'express';
import { listMensalidades, baixarMensalidadeManual, checkoutMensalidade, rodarFaturamentoAutomatico, createMensalidadeAvulsa, updateMensalidade, deleteMensalidade } from './financeiro.controller';

const router = Router();

router.get('/', listMensalidades);
router.post('/faturamento-cron', rodarFaturamentoAutomatico);
router.post('/mensalidades', createMensalidadeAvulsa);
router.put('/mensalidades/:id', updateMensalidade);
router.delete('/mensalidades/:id', deleteMensalidade);
router.put('/:id/baixar', baixarMensalidadeManual);
router.post('/:id/checkout', checkoutMensalidade);

export default router;
