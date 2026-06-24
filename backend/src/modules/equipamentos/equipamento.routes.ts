import { Router } from 'express';
import { createEquipamento, listEquipamentos, transferToTecnico } from './equipamento.controller';

const router = Router();

router.post('/', createEquipamento);
router.get('/', listEquipamentos);
router.put('/:id/transferir', transferToTecnico);

export default router;
