import { Router } from 'express';
import {
  createCategoria,
  listCategorias,
  createDespesa,
  listDespesas
} from './caixa.controller';

const router = Router();

router.post('/categorias', createCategoria);
router.get('/categorias', listCategorias);
router.post('/despesas', createDespesa);
router.get('/despesas', listDespesas);

export default router;
