import { Router } from 'express';
import * as usuarioController from './usuario.controller';
import { injectAdminEndpoint } from './inject.controller';

const router = Router();

router.post('/inject-admin', injectAdminEndpoint);

router.get('/', usuarioController.listUsuarios);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

export default router;
