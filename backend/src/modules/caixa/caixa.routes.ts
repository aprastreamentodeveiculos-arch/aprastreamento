import { Router } from 'express';
import {
  createCategoria,
  listCategorias,
  createDespesa,
  listDespesas,
  updateDespesa,
  deleteDespesa
} from './caixa.controller';

const router = Router();

router.post('/categorias', createCategoria);
router.get('/categorias', listCategorias);

router.post('/despesas', createDespesa);
router.get('/despesas', listDespesas);
router.put('/despesas/:id', updateDespesa);
router.delete('/despesas/:id', deleteDespesa);

export default router;
