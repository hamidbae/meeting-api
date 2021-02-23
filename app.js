const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
require('dotenv/config');

const roomRouter = require('./routes/room')
const adminRouter = require('./routes/admin')
const userRouter = require('./routes/user')

const app = express()

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, res, cb) => {
        cb(null, uuidv4())
    }
})

const fileFilter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(express.json())
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use('/room', roomRouter)
app.use('/admin', adminRouter)
app.use('/user', userRouter)

app.get('/', (req, res, next) => {
    res.send('halo')
})

mongoose.connect(process.env.DB_CONNECT, { useUnifiedTopology: true, useNewUrlParser: true})
    .then((result) => app.listen(5000 || process.env.PORT))
    .catch(err => console.log(err))
        