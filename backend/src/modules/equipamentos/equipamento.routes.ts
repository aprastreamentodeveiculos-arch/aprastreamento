import { Router } from 'express';
import { createEquipamento, listEquipamentos, transferToTecnico, updateEquipamento, deleteEquipamento } from './equipamento.controller';

const router = Router();

router.post('/', createEquipamento);
router.get('/', listEquipamentos);
router.put('/:id/transferir', transferToTecnico);
router.put('/:id', updateEquipamento);
router.delete('/:id', deleteEquipamento);

export default router;
