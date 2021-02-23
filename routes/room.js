const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const userAuth = require('../middleware/userAuth')

const roomController = require('../controllers/room')

router.get('/', roomController.getRooms)

router.post('/', adminAuth, roomController.createRoom)

router.get('/:roomId', roomController.getRoom)

router.get('/add-participant/:roomId', userAuth, roomController.addParticipant)

router.put('/:roomId', adminAuth, roomController.updateRoom)

router.put('/checkin/:roomId/:userId', adminAuth, roomController.userCheckIn)

router.delete('/:roomId', adminAuth, roomController.deleteRoom)

module.exports = router