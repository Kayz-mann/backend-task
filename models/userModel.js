const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
    },
    role: {
        type: Number,
        default: 0
    },
    phone_number: {
        type: Number,
        required: [true, "Please enter your phone number"],
    },
    avatar: {
        type: String,
        default: "https://images.pexels.com/photos/8806013/pexels-photo-8806013.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
    },
   
},{
    timestamps: true
})


module.exports = mongoose.model("Users", userSchema)