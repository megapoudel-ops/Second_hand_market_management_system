const router = require('express').Router();
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { getMyPreferences, updateMyPreferences } = require('../controllers/preference.controller');
const { preferenceSchema } = require('../validators/preference.validator');

router.use(authenticate);

router.get('/me', getMyPreferences);
router.put('/me', validate(preferenceSchema), updateMyPreferences);

module.exports = router;
