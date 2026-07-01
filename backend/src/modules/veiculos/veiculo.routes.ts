import { Router } from 'express';
import * as veiculoController from './veiculo.controller';

const router = Router();

// Rota de Inserção de Frota Rápida
router.post('/bulk', veiculoController.bulkCreate);

export default router;
