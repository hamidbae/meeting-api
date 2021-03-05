const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const cloudinary = require('../utils/cloudinary')
require('dotenv/config');

exports.signup = async (req, res, next) => {
    const { email, password } = req.body
    if(!req.file) {
        const error = new Error('No image provided.')
        error.statusCode = 422
        throw error
    }
    if(!validator.isEmail(email)){
        const error = new Error('Email not valid')
        error.code = 301
        throw error  
    }
    if(password.length < 6){
        const error = new Error('Min password length 6')
        error.code = 301
        throw error
    }

    try{
        // const imageUrl = req.file.path.replace('\\', '/')
        const image = await cloudinary.uploader.upload(req.file.path)
        const hashedPw = await bcrypt.hash(password, 12)
        
        const user = new User({
            email: email,
            password: hashedPw,
            imageUrl: image.secure_url,
            cloudinary_id: image.public_id
        })
    
        await user.save()
    
        res.status(201).json({
            message: 'user created',
            user: {
                _id: user._id, 
                email: user.email,
                imageUrl: user.imageUrl,
            }
        })
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
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

exports.updateUser = async (req, res, next) => {
    const { email, password } = req.body
    if(email && !validator.isEmail(email)){
        const error = new Error('Email not valid')
        error.code = 301
        throw error  
    }
    if(password && password.length < 6){
        const error = new Error('Min password length 6')
        error.code = 301
        throw error
    }
    
    try{
        let user = await User.findById(req.userId)
        let image

        if(req.file) {
            await cloudinary.uploader.destroy(user.cloudinary_id)
            image = await cloudinary.uploader.upload(req.file.path)
        }else{
            image = {
                secure_url: user.imageUrl,
                public_id: user.cloudinary_id
            }
        }
        const hashedPw = password ? await bcrypt.hash(password, 12) : user.password
        
        user.email = email,
        user.password = hashedPw,
        user.imageUrl = image.secure_url,
        user.cloudinary_id = image.public_id
        
        await user.save()
    
        res.status(201).json({
            message: 'user updated',
            user: {
                _id: user._id, 
                email: user.email,
                imageUrl: user.imageUrl
            }
        })
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.deleteUser = async (req, res, next) => {    
    try{
        let user = await User.findById(req.userId)
        await cloudinary.uploader.destroy(user.cloudinary_id)
        await user.remove()
    
        res.status(201).json({
            message: 'user deleted',
            user: {
                _id: user._id, 
                email: user.email,
            }
        })
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.getUsers = async (req, res, next) => {
    try{
        const users = await User.find({}, { email: 1, imageUrl: 1})
        res.status(200).json({
            message: 'list user',
            users: users
        })
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.getUser = async (req, res, next) => {
    try{
        const user = await User.findById(req.params.userId, { email: 1, imageUrl: 1 })
        res.status(200).send(user)
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}