const Admin = require('../models/admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

exports.createAdmin = async (req, res, next) => {
    try{
        const {name, email, password} = req.body
        const isRegistered = await Admin.findOne({ email: email })
        console.log(isRegistered)
        if(isRegistered){
            const error = new Error('This email has been registered')
            error.code = 301
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
        const hashedPw = await bcrypt.hash(password, 12)
        const admin = new Admin({
            name: name,
            email: email,
            password: hashedPw
        })

        await admin.save()
    
        res.status(201).json({ 
            message: 'admin created', 
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            } 
        })
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.updateAdmin = async (req, res, next) => {
    try{
        let {name, email, password} = req.body
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

        const admin = await Admin.findById(req.adminId)

        admin.hashedPw = password ? await bcrypt.hash(password, 12) : admin.password
        admin.name = name ? name : admin.name
        admin.email = email ? email: admin.email

        await admin.save()
    
        res.status(201).json({ 
            message: 'admin updated', 
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            } 
        })
    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.deleteAdmin = async (req, res, next) => {
    try{
        const admin = Admin.findById(req.adminId)
        await admin.remove()
        res.status(200).json({ message: 'admin deleted' })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.adminLogin = (req, res, next) => {
    const { email, password } = req.body
    Admin.findOne({email: email})
        .then(admin => {
            if(!admin) {
                const error = new Error('A admin with this email could not be found.')
                error.statusCode = 401
                throw error
            }
            loadedAdmin = admin
            return bcrypt.compare(password, admin.password)
        })
        .then(isEqual => {
            if(!isEqual) {
                const error = new Error('Wrong password')
                error.statusCode(401)
                throw error
            }
            const token = jwt.sign({
                email: loadedAdmin.email,
                adminId: loadedAdmin._id.toString()
            }, process.env.ADMIN_AUTH_KEY,
            {
                expiresIn: '1h'
            })
            res.status(200).json({ token: token, adminId: loadedAdmin._id.toString() })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}
