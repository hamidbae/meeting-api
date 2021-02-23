const mongoose = require('mongoose')
const { isEmail } = require('validator')
const Schema = mongoose.Schema

const adminSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        validate: [isEmail, 'Please, insert a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Minimum password length is 6']
    }
})

const admin = mongoose.model('Admin', adminSchema)

module.exports = admin