const Admin = require('../models/admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.createAdmin = (req, res, next) => {
    const {name, email, password} = req.body
    
    bcrypt
    .hash(password, 12)
    .then(hashedPw => {
        const admin = new Admin({
            name: name,
            email: email,
            password: hashedPw
        })
        return admin.save()
    })
    .then(admin => {
        res.status(201).json({ 
            message: 'admin created', 
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
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

exports.updateAdmin = (req, res, next) => {
    const {name, email, password} = req.body
    bcrypt
    .hash(password, 12)
    .then(hashedPw => {
        Admin.findById(req.params.adminId)
        .then(admin => {
            if(!admin) {
                const error = new Error('Admin not found')
                error.statusCode = 404
                throw error
            }
            admin.name = name
            admin.email = email
            admin.password = hashedPw
            return admin.save()
        })
        .then(adminUpdated => {
            res.status(201).json({ 
                message: 'Admin was updated', 
                admin: {
                    _id: adminUpdated._id,
                    name: adminUpdated.name,
                    email: adminUpdated.email
                }
            })
        })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
}

exports.deleteAdmin = (req, res, next) => {
    const adminId = req.params.adminId
    Admin.findById(adminId)
    .then(admin => {
        if(!admin){
            const error = new Error('Admin not found')
            error.statusCode = 404
            throw error
        }
        return Admin.findByIdAndRemove(adminId)
    })
    .then(deletedAdmin => {
        res.status(200).json({ message: 'admin deleted' })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    })
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
