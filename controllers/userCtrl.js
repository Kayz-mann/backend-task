const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendMail = require('./sendMail')
const {google} = require('googleapis')
const {OAuth2} = google.auth
// const fetch = require('node-fetch')


const {CLIENT_URL} = process.env
const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID)

const userCtrl = {
    register: async (req, res) => {
        try {
            const {name, email, password, phone_number} = req.body
            
            if (!name || !email || !password || !phone_number)
            return res.status(400).json({msg: "Please fill in all fields"})

            if(!validateEmail)
            return res.status(400).json({msg: "Invalid email address"})

            if(!validatePhoneNumber)
            return res.status(400).json({msg: "Please enter a correct mobile number"})

            const user = await Users.findOne({email})
            if(user) return res.status(400).json({msg: "This email already exists"})

            if(password.length < 6)
            return res.status(400).json({msg: "Password must be at least 6 characters"})

            const passwordHash = await bcrypt.hash(password, 12)
            
            const newUser = {
                name, email, phone_number, password: passwordHash
            }

            const activation_token = createActivationToken(newUser)

            const url = `${CLIENT_URL}/user/activate${activation_token}`
            sendMail(email, url)
            
            res.json({msg: "Register Success! Please activate your email to continue"}) 
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    activateEmail: async (req, res) => {
        try {
            const {activation_token} = req.body
            const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)

            console.log(user)
            const {name, email, password, phone_number} = user
            const check = await Users.findOne({email})
            if(check) return res.status(400).json({msg: "This email already exists"})

            const newUser = new Users({
                name, email, password
            })

            await newUser.save()
            res.json({msg: "Account has been activated!"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
        
    },
    login: async(req, res) => {
        try{
        const {email, password} = req.body
        const user = await Users.findOne({email})
        
        if(!user) return res.status(400).json({msg: "This email does not exist"})
       
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) return res.status(400).json({msg: "Password is incorrect"})

        const refresh_token = createRefreshToken({id: user._id})
        res.cookie('refreshtoken', refresh_token, {
            httpOnly: true,
            path: '/user/refresh_token',
            // 7 days
            maxAge: 7*24*60*60*1000     
        })
        res.json({msg: "Login successful!"})
        
    } catch(err) {
            return res.status(500).json({msg: err.message})
        }
        
       

    },
    googleLogin: async (req, res) => {
        try{
            const {tokenId} = req.body
            const verify = await client.verifyIdToken({idToken: tokenId, audience: process.env.MAILING_SERVICE_CLIENT_ID})
            const {email_verified, email, name, picture} = verify.payload
            const password = email + process.env.GOOGLE_SECRET
            const passwordHash = await bcrypt.hash(password, 12)
            if(!email_verified) return res.status(400).json({msg: "Email verfication failed"})

            if(email_verified){
                const user = await Users.findOne({email})
                if(user){
                    const isMatch = await bcrypt.compare(password, user.password)
                    if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})
                }
                const refresh_token = createRefreshToken({id: user._id})
                res.cookie('refreshtoken', refresh_token, {
                    httpOnly: true,
                    path: '/user/refresh_token',
                    maxAge: 7*24*60*60*1000 
                })
                res.json({msg: "Login success!"})
            } else {
                const newUser = new Users({
                    name, email, password: passwordHash, avatar: picture
                })
                await newUser.save()
                const refresh_token = createRefreshToken({id: newUser._id})
                res.cookie('refreshtoken', refresh_token, {
                    httpOnly: true,
                    path: '/user/refresh_token',
                    maxAge: 7*24*60*60*1000 
                })
                res.json({msg: "Login success!"})
            }

        }catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    facebookLogin: async (req, res) => {
        try{
            const {accessToken, userID} = req.body
            const data = await get(URL).then(res => res.json()).then(res => {return res})
            const URL = `https://graph.facebook.com/v2.9/${userID}/fields=id,name,email,picture&access_token=${accessToken}`
            const {email, name, picture} = data
            const password = email + process.env.FACEBOOK_SECRET
            const passwordHash = await bcrypt.hash(password, 12)
            if(!email_verified) return res.status(400).json({msg: "Email verfication failed"})

            if(email_verified){
                const user = await Users.findOne({email})
                if(user){
                    const isMatch = await bcrypt.compare(password, user.password)
                    if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})
                }
                const refresh_token = createRefreshToken({id: user._id})
                res.cookie('refreshtoken', refresh_token, {
                    httpOnly: true,
                    path: '/user/refresh_token',
                    maxAge: 7*24*60*60*1000 
                })
                res.json({msg: "Login success!"})
            } else {
                const newUser = new Users({
                    name, email, password: passwordHash, avatar: picture.data.url
                })
                await newUser.save()
                const refresh_token = createRefreshToken({id: newUser._id})
                res.cookie('refreshtoken', refresh_token, {
                    httpOnly: true,
                    path: '/user/refresh_token',
                    maxAge: 7*24*60*60*1000 
                })
                res.json({msg: "Login success!"})
            }

        }catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getAccessToken: (req, res) => {
        try {
            const rf_token = req.cookies.refresh_token
            if(!rf_token) return res.status(400).json({msg: "Please login now!"})

            jwt.verify(rf_token, process,env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) return res.status(400).json({msg: "Please login now!"})

                const access_token = createAccessToken({id: user.id})
                res.json({access_token})
            })
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    forgotPassword: async (req, res) => {
        try{
            const {email} = req.body
            const user = await Users.findOne({email})
            if(!user) return res.status(400).json({msg: "This email does not exist."})

            const access_token = createAccessToken({id: user._id})
            const url = `${CLIENT_URL}/user/reset/${access_token}`

            sendMail(email, url, "Reset your password")
            res.json({msg: "Re-send the password, please check your email"})
        } catch(err) {
            return res.status(500).json({msg: err.message})
        }
    },
    resetPassword: async (req, res) => {
         try{
             const {password} = req.body
             console.log(password)
             const passwordHash = await bcrypt.hash(password, 12)
             await Users.findOneAndUpdate({_id: req.user.id}, {
                 password: passwordHash
             })
             res.json({msg: "Password successfully changed!"})
             
         } catch (err) {
            return res.status(500).json({msg: err.message})

         }
    },
    getUserInfor: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password')

            res.json(user)
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getUsersAllInfor: async (req, res) => {
        try{
            const users = await Users.find().select('-password')
            res.json(users) 
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', {path: 'user/refresh_token'})
            return res.json({msg: "Logged out"})
        } catch(err) {
            return res.status(500).json({msg: err.message})
        }
    },
    updateUser: async (req, res) => {
        try {
            const {name, avatar} = req.body
            await Users.findByIdAndUpdate({_id: req.user.id}, {
                name, avatar
            })
            res.json({msg: "Update Successful"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    updateUsersRole: async (req, res) => {
        try {
            const {role} = req.body
            await Users.findByIdAndUpdate({_id: req.params.id}, {
                role
            })
            res.json({msg: "Update Successful"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    deleteUser: async (req, res) => {
        try {
            const {role} = req.body
            await Users.findByIdAndDelete(req.params.id) 
            res.json({msg: "Successfully Deleted!"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },


}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return re.test(email)

}

function validatePhoneNumber(phone_number){
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return re.test(phone_number)
}

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'} )
}

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {expiresIn: '5m'} )
}

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'} )
}
 
module.exports = userCtrl


// 54:24