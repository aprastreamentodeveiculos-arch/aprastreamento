import { Router } from 'express';
import { getHistoricoPorVeiculo, getHistoricoPorRastreador } from './historico.controller';

const router = Router();

router.get('/veiculo/:placa', getHistoricoPorVeiculo);
router.get('/rastreador/:imei', getHistoricoPorRastreador);

export default router;
