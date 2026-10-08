const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const upload = require('../middleware/uploadMiddleware');

router.get('/login', authController.getLogin);
router.post('/login', upload.none(), authController.postLogin);

router.get('/register', authController.getRegister);
router.get('/register/:role', authController.getRegister);
router.post('/register', upload.single('avatar'), authController.postRegister);

router.get('/logout', authController.logout);

// Quick Role Switching Endpoints
router.get('/switch-role/:role', authController.switchRole);
router.post('/switch-role/:role', authController.switchRole);
router.post('/switch-role', (req, res) => {
  const role = req.body.role || 'student';
  res.redirect(`/auth/switch-role/${role}`);
});

module.exports = router;

