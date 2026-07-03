import { Router } from 'express';
import * as usuarioController from './usuario.controller';

const router = Router();

router.get('/', usuarioController.listUsuarios);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

export default router;
