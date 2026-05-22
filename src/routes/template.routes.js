const router = require('express').Router();
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createTemplate, getTemplates, getTemplate } = require('../controllers/template.controller');
const { templateSchema } = require('../validators/template.validator');

router.use(authenticate);

router.get('/', getTemplates);
router.get('/:key', getTemplate);
router.post('/', authorize('admin'), validate(templateSchema), createTemplate);

module.exports = router;
