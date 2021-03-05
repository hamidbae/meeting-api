const adminAuth = require('../middleware/adminAuth')
const userAuth = require('../middleware/userAuth')
const roomController = require('../controllers/room')

const express = require('express')
const router = express.Router()

router.get('/', roomController.getRooms)
router.get('/:roomId', roomController.getRoom)
router.post('/create', adminAuth, roomController.createRoom)
router.put('/update/:roomId', adminAuth, roomController.updateRoom)
router.delete('delete/:roomId', adminAuth, roomController.deleteRoom)

router.post('/add-participant/:roomId', userAuth, roomController.addParticipant)
router.put('/checkin/:roomId/:userId', adminAuth, roomController.userCheckIn)

module.exports = router