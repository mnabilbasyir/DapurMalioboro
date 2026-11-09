const express = require('express');
const router  = express.Router();
const usersController = require('../controller/usersController');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/role');

router.get('/users',        auth, checkRole('admin'), usersController.TampilDataUser);
router.get('/users/:id',    auth, usersController.TampilDataUserById);
router.post('/register',    usersController.CreateDataUser);
router.post('/login',       usersController.login);
router.post('/logout',      auth, usersController.logout);
router.put('/users/:id',    auth, checkRole('admin'), usersController.UpdateDataUser);
router.delete('/users/:id', auth, checkRole('admin'), usersController.DeleteDataUser);

module.exports = router;
