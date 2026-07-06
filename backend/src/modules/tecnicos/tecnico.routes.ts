import { Router } from 'express';
import { createTecnico, listTecnicos, updateTecnico, deleteTecnico } from './tecnico.controller';

const router = Router();

router.post('/', createTecnico);
router.get('/', listTecnicos);
router.put('/:id', updateTecnico);
router.delete('/:id', deleteTecnico);

export default router;
