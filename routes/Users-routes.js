const express = require('express');
const {check} = require('express-validator')
const fileUpload = require('../middleware/file-upload');

const userController = require('../controllers/users-controller')

const router = express.Router();

router.get('/', userController.getUser);

router.post('/signup', fileUpload.single('image'),
[
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min: 6}),
    check('name').not().isEmpty()
], userController.signup);

router.post('/login', userController.login);

module.exports = router