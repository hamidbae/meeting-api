const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const { v4: uuidv4 } = require('uuid');
require('dotenv/config');

const roomRouter = require('./routes/room')
const adminRouter = require('./routes/admin')
const userRouter = require('./routes/user')

const app = express()

app.use(express.json())

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
    .then((result) => app.listen(process.env.PORT || 5000))
    .catch(err => console.log(err))
        