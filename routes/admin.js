const express = require('express')
const router = express.Router()

const adminController = require('../controllers/admin')

router.post('/signup', adminController.createAdmin)

router.post('/login', adminController.adminLogin)

router.put('/:adminId', adminController.updateAdmin)

router.delete('/:adminId', adminController.deleteAdmin)

module.exports = router