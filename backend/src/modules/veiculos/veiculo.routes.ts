import { Router } from 'express';
import * as veiculoController from './veiculo.controller';

const router = Router();

// Rota de Inserção de Frota Rápida
router.post('/bulk', veiculoController.bulkCreate);
router.put('/:id', veiculoController.updateVeiculo);
router.delete('/:id', veiculoController.deleteVeiculo);

export default router;
