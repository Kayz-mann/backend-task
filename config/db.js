const mongoose = require("mongoose");
require('dotenv').config({path: "./.env"})


const connectDB = async() => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useCreateIndex: true -- deprecated
    });

    console.log("MongoDB connected")
}

module.exports = connectDB