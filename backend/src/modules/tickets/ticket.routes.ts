import { Router } from 'express';
import { createTicket, listTickets } from './ticket.controller';

const router = Router();

router.post('/', createTicket);
router.get('/', listTickets);

export default router;
