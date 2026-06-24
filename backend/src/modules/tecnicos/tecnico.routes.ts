import { Router } from 'express';
import { createTecnico, listTecnicos } from './tecnico.controller';

const router = Router();

router.post('/', createTecnico);
router.get('/', listTecnicos);

export default router;
