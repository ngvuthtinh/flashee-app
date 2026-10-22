import { Router } from 'express';
import { authController } from '../controller/auth';
import { validateBody } from '../middleware/validateBody';
import { registerSchema, loginSchema, refreshSchema } from '../validation/authSchemas';

const router  = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshSchema), authController.refresh);
router.post('/logout', validateBody(refreshSchema), authController.logout);

export default router;
