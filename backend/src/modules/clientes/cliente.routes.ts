import { Router } from 'express';
import {
  createCliente,
  listClientes,
  getClienteById,
  updateCliente,
  deleteCliente,
  getClientePanorama
} from './cliente.controller';

const router = Router();

router.post('/', createCliente);
router.get('/', listClientes);
router.get('/:id', getClienteById);
router.get('/:id/panorama', getClientePanorama);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;
