const Room = require('../models/room')
const User = require('../models/user')
const sendMail = require('../mail/mail')
const cron = require('node-cron')

exports.getRooms = (req, res, next) => {
    Room.find()
    .then(result => {
        res.status(200).send(result)
    })
}

exports.createRoom = (req, res, next) => {
    const { topic, roomName, capacity, time } = req.body
    const meetSplit = time.split(/[-/ ,:]/)
    const meetTime = new Date(...meetSplit)
    const room = new Room({
        topic: topic,
        roomName: roomName,
        capacity: capacity,
        time: meetTime
    })
    room.save()
    .then(result => {
        res.status(201).json({ message: 'a room was created', room: result})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
}

exports.getRoom = (req, res, next) => {
    Room.findById(req.params.roomId)
    .then(result => {
        res.status(200).send(result)
    })
}

exports.updateRoom = (req, res, next) => {
    const { topic, roomName, capacity, time } = req.body
    const meetSplit = time.split(/[-/ ,:]/)
    const meetTime = new Date(...meetSplit)
    Room.findById(req.params.roomId)
    .then(room => {
        if(!room) {
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        room.topic = topic
        room.roomName = roomName
        room.capacity = capacity
        room.time = meetTime
        return room.save()
    })
    .then(roomUpdated => {
        res.status(201).json({ message: 'Room was updated', room: roomUpdated})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
    
}

exports.deleteRoom = (req, res, next) => {
    const roomId = req.params.roomId
    Room.findById(roomId)
    .then(room => {
        if(!room){
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        return Room.findByIdAndRemove(roomId)
    })
    .then(deletedRoom => {
        res.status(200).json({ message: 'a room was deleted' })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
}

exports.addParticipant = (req, res, next) => {
    const roomId = req.params.roomId
    let userRoom

    Room.findById(roomId)
    .then(room => {
        if (!room) {
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        if (room.participants.length >= room.capacity) {
            const error = new Error('Room already full')
            error.statusCode = 404
            throw error
        }
        if (room.participants.includes(req.userId)) {
            const error = new Error('Your are already in room')
            error.statusCode = 404
            throw error
        }
        userRoom = room
        room.participants.push(req.userId)
        return room.save()
    })
    .then(roomUpdated => {
        return User.findById(req.userId)
    })
    .then(user => {
        user.meetingLists.push(userRoom)
        return user.save()
    })
    .then(result => {
        let subject = 'book a meet'
        let text = `terimakasih telah memesan meeting dengan topik ${userRoom.topic}`

        sendMail(result.email, subject, text, function(err, data) {
            if (err) {
                const error = new Error('Email not sent')
                error.statusCode = 404
                throw error
            }
        })

        const cornDate = new Date(userRoom.time)

        const month = cornDate.getMonth()
        const date = cornDate.getDate()
        const hours = cornDate.getHours()
        const minutes = cornDate.getMinutes()

        const task = cron.schedule(`0 1 ${date} ${month} *`, () => {
            subject = 'meeting reminder'
            text = `a meeting with topic ${userRoom.topic} will be held this day`

            sendMail(result.email, subject, text, function(err, data) {
                if (err) {
                    const error = new Error('Email not sent')
                    error.statusCode = 404
                    throw error
                }
            })
            task.destroy()
        })

        res.status(201).json({message: 'room added to user', userId: result._id})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
    
}

exports.userCheckIn = (req, res, next) => {
    const userId = req.params.userId
    const roomId = req.params.roomId
    let userRoom

    Room.findById(roomId)
    .then(room => {
        if (!room) {
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        if(!room.participants.includes(userId)){
            const error = new Error('User not being participant')
            error.statusCode = 404
            throw error
        }
        if(room.userCheckIn.includes(userId)){
            const error = new Error('User already in')
            error.statusCode = 404
            throw error
        }
        userRoom = room
        
        room.userCheckIn.push(userId)
        return room.save()
    })
    .then(result => {
        return User.findById(userId)
    })
    .then(user => {
        let subject = 'meeting attended'
        let text = `thanks for joining our meeting with topic ${userRoom.topic}`

        sendMail(user.email, subject, text, function(err, data) {
            if (err) {
                const error = new Error('Email not sent')
                error.statusCode = 404
                throw error
            }
        })
        res.status(201).json({ message: 'Participant checked' })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
}