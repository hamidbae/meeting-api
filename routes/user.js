const express = require('express')
const router = express.Router()
const userAuth = require('../middleware/userAuth')

const userController = require('../controllers/user')

router.get('/', userController.getUsers)
router.get('/:userId', userController.getUser)
router.post('/signup', userController.signup)
router.post('/login', userController.login)
router.post('/update', userAuth, userController.updateUser)
router.delete('/delete', userAuth, userController.deleteUser)

module.exports = router