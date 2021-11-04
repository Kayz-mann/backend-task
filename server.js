require('dotenv').config({path: "./config"})
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const connectDB = require("./config/db")


// Middleware ------
// Config
const app = express()
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(fileUpload({
    useTempFiles: true 
}))

// Routes
app.use('/user', require('./routes/userRouter'))
app.use('/api', require('./routes/upload'))

app.use('/', (req, res, next) => {
    res.json( "Hello World")
})
// Middleware ------

// Connect to the database
connectDB()


const PORT = process.env.PORT || 5000
 const server = app.listen(PORT, () => {
    console.log('Server is running on port', PORT)
})

// to shorten runtime error line
process.on("unhandledRejection", (err, promise) => {
    console.log(`Logged Error: ${err}`);
    server.close(() => process.exit(1))
})

module.exports = app