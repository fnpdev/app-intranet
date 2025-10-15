const express = require('express');
const router = express.Router();
const { controllerLogin } = require('../controllers/authController');

router.post('/login', controllerLogin);

module.exports = router;
