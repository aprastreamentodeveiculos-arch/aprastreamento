import { Router } from 'express';
import { createPlano, listPlanos, updatePlano } from './plano.controller';

const router = Router();

router.post('/', createPlano);
router.get('/', listPlanos);
router.put('/:id', updatePlano);

export default router;
