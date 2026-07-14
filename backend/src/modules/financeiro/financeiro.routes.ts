import { Router } from 'express';
import { listFaturas, baixarFaturaManual, checkoutFatura, rodarFaturamentoAutomatico, createFaturaAvulsa, updateFatura, deleteFatura, bulkDeleteFaturas, bulkCheckoutFaturas } from './financeiro.controller';
import { wipeSafe } from './wipe.controller';

const router = Router();

router.get('/', listFaturas);
router.post('/faturamento-cron', rodarFaturamentoAutomatico);
router.post('/wipe-safe', wipeSafe);
router.post('/faturas', createFaturaAvulsa);
router.post('/faturas/bulk-delete', bulkDeleteFaturas);
router.post('/faturas/bulk-checkout', bulkCheckoutFaturas);
router.put('/faturas/:id', updateFatura);
router.delete('/faturas/:id', deleteFatura);
router.put('/:id/baixar', baixarFaturaManual);
router.post('/:id/checkout', checkoutFatura);

export default router;
