const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = (req, res, next) => {
    if(!req.file) {
        const error = new Error('No image provided.')
        error.statusCode = 422
        throw error
    }
    const imageUrl = req.file.path.replace('\\', '/')
    const { email, password } = req.body
    bcrypt
    .hash(password, 12)
    .then(hashedPw => {
        const user = new User({
            email: email,
            password: hashedPw,
            imageUrl: imageUrl
        })
        return user.save()
    })
    .then(user => {
        res.status(201).json({
            message: 'user created',
            user: {
                _id: user._id, 
                email: user.email,
                imageUrl: user.imageUrl
            }
        })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
}

exports.login = (req, res, next) => {
    const { email, password } = req.body
    User.findOne({email: email})
        .then(user => {
            if(!user) {
                const error = new Error('A user with this email could not be found.')
                error.statusCode = 401
                throw error
            }
            loadedUser = user
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if(!isEqual) {
                const error = new Error('Wrong password')
                error.statusCode(401)
                throw error
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            }, process.env.USER_AUTH_KEY,
            {
                expiresIn: '1h'
            })
            res.status(200).json({ token: token, userId: loadedUser._id.toString() })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}