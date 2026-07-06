import { Router } from 'express';
import { listMensalidades, baixarMensalidadeManual, checkoutMensalidade, rodarFaturamentoAutomatico, createMensalidadeAvulsa, updateMensalidade, deleteMensalidade, bulkDeleteMensalidades } from './financeiro.controller';

const router = Router();

router.get('/', listMensalidades);
router.post('/faturamento-cron', rodarFaturamentoAutomatico);
router.post('/mensalidades', createMensalidadeAvulsa);
router.post('/mensalidades/bulk-delete', bulkDeleteMensalidades);
router.put('/mensalidades/:id', updateMensalidade);
router.delete('/mensalidades/:id', deleteMensalidade);
router.put('/:id/baixar', baixarMensalidadeManual);
router.post('/:id/checkout', checkoutMensalidade);

export default router;
