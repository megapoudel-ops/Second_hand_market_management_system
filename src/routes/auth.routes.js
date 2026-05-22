const router = require('express').Router();
const validate = require('../middleware/validate.middleware');
const { register, login } = require('../controllers/auth.controller');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

module.exports = router;
