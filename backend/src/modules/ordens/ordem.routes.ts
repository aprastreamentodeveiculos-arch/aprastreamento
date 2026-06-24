import { Router } from 'express';
import { createOrdem, listOrdens, approveOrdem, rejectOrdem, concluirOrdem } from './ordem.controller';

const router = Router();

router.post('/', createOrdem);
router.get('/', listOrdens);
router.put('/:id/aprovar', approveOrdem);
router.put('/:id/rejeitar', rejectOrdem);
router.put('/:id/concluir', concluirOrdem);

export default router;
