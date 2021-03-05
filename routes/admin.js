const adminAuth = require('../middleware/adminAuth')
const adminController = require('../controllers/admin')

const express = require('express')
const router = express.Router()

router.post('/signup', adminController.createAdmin)
router.post('/login', adminController.adminLogin)
router.put('/update', adminAuth, adminController.updateAdmin)
router.delete('/delete', adminAuth,  adminController.deleteAdmin)

module.exports = router