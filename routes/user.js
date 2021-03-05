const express = require('express')
const router = express.Router()

const userAuth = require('../middleware/userAuth')
const upload = require('../utils/multer')
const userController = require('../controllers/user')

router.get('/', userController.getUsers)
router.get('/:userId', userController.getUser)
router.post('/signup', upload.single('image'), userController.signup)
router.post('/login', userController.login)
router.post('/update', upload.single('image'), userAuth, userController.updateUser)
router.delete('/delete', userAuth, userController.deleteUser)

module.exports = router