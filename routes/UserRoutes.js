const express = require('express');

const router = express.Router();

const UserController = require('../controllers/UserController');

// Middlewares
const checkToken = require('../helpers/check-token');
const { imageUpload } = require('../helpers/image-upload');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/checkuser', UserController.checkUser);
router.get('/:id', UserController.getUserById);
router.patch(
  '/edit/:id',
  checkToken,
  imageUpload.single('image'),
  UserController.editUser,
);

module.exports = router;
