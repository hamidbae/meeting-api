const Room = require('../models/room')
const User = require('../models/user')
const sendMail = require('../utils/mail')
const cron = require('node-cron')

exports.getRooms = (req, res, next) => {
    Room.find()
    .then(result => {
        res.status(200).send(result)
    })
}

exports.createRoom = async (req, res, next) => {
    try{
        const { topic, roomName, capacity, time } = req.body

        let timeSplit = time.split(/[-/ ,:]/)
        timeSplit[1]--
        const meetTime = new Date(...timeSplit)

        const room = new Room({
            topic: topic,
            roomName: roomName,
            capacity: capacity,
            time: meetTime
        })
    
        await room.save()
        
        res.status(201).json({ message: 'a room was created', room: room})
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.getRoom = async (req, res, next) => {
    try{
        const room = await Room.findById(req.params.roomId)
        if(!room) {
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        res.status(200).send(room)
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.updateRoom = async (req, res, next) => {
    try {
        const { topic, roomName, capacity, time } = req.body
    
        let room = await Room.findById(req.params.roomId)
        if(!room) {
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        
        // format time yyyy/mm/dd
        let meetTime
        if(time){
            let timeSplit = time.split(/[-/ ,:]/)
            timeSplit[1]--
            meetTime = new Date(...timeSplit)
        }else{
            meetTime = room.time
        }
    
        room.topic = topic ? topic : room.topic
        room.roomName = roomName ? roomName : room.roomName
        room.capacity = capacity ? capacity : room.capacity
        room.time = meetTime
    
        await room.save()
    
        res.status(201).json({ message: 'Room was updated', room: room })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.deleteRoom = async (req, res, next) => {
    try{
        const room = Room.findById(req.params.roomId)
        if(!room){
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        room.remove()
        res.status(200).json({ message: 'a room was deleted' })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.addParticipant = async (req, res, next) => {
    try{
        let room = await Room.findById(req.params.roomId)
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
    
        let user = await User.findById(req.userId)
        
        room.participants.push(req.userId)
        user.meetingLists.push(room)
        await room.save()
        await user.save()
    
        // send email to user
        let subject = 'book a meet'
        let text = `terimakasih telah memesan meeting dengan topik ${room.topic}`
    
        sendMail(user.email, subject, text, function(err, data) {
            if (err) {
                const error = new Error('Email not sent')
                error.statusCode = 404
                throw error
            }
        })
    
        // schedule email sending
        const cornDate = new Date(room.time)
    
        const month = cornDate.getMonth() + 1
        const date = cornDate.getDate()

        console.log(date, month)
    
        const task = cron.schedule(`13 11 ${date} ${month} *`, () => {
            subject = 'meeting reminder'
            text = `a meeting with topic ${room.topic} will be held this day`
    
            sendMail(user.email, subject, text, function(err, data) {
                if (err) {
                    const error = new Error('Email not sent')
                    error.statusCode = 404
                    throw error
                }
            })
            task.destroy()
        })
    
        res.status(201).json({ message: 'room added to user', room: room })
    }catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.userCheckIn = async (req, res, next) => {
    try{

        const { userId, roomId } = req.params
        let room = await Room.findById(roomId)
        if (!room) {
            const error = new Error('Room not found')
            error.statusCode = 404
            throw error
        }
        let user = await User.findById(userId)
        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }
        if(!room.participants.includes(userId)){
            const error = new Error('User not being participant')
            error.statusCode = 404
            throw error
        }
        if(room.userCheckIn.includes(userId)){
            const error = new Error('User already checked in')
            error.statusCode = 404
            throw error
        }
    
        room.userCheckIn.push(userId)
        await room.save()
    
        // send email check in
        let subject = 'meeting attended'
        let text = `thanks for joining our meeting with topic ${room.topic}`
    
        sendMail(user.email, subject, text, function(err, data) {
            if (err) {
                const error = new Error('Email not sent')
                error.statusCode = 404
                throw error
            }
        })
    
        res.status(201).json({ message: 'Participant checked in' })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}