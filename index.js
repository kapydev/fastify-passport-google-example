const fastify = require('fastify')({ logger: true })
const fastifyPassport = require('fastify-passport')
const fastifySecureSession = require('fastify-secure-session')
const fs = require('fs')
const path = require('path')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const dotenv = require('dotenv')

dotenv.config()

fastify.register(fastifySecureSession, {
    key: fs.readFileSync(path.join(__dirname,'not-so-secret-key')),
    cookie: {
        path: '/'
    }
})

fastify.register(fastifyPassport.initialize())
fastify.register(fastifyPassport.secureSession())

fastifyPassport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, function (accessToken,refreshToken,profile,cb) {
    cb(undefined, profile)
}
))

fastifyPassport.registerUserDeserializer(async(user,req) => {
    return user
})

fastifyPassport.registerUserSerializer(async(user,req) => {
    return user
})

fastify.get('/',
    async (req, res) => {
        return `👋 Hello ${req.user.displayName} 👋`
    }
)

fastify.get('/auth/google/callback',
    {preValidation: fastifyPassport.authenticate('google',{scope:['profile']})},
    async (req,res) => {
        res.redirect('/')
    }
)

fastify.get('/login', fastifyPassport.authenticate('google', {scope: ['profile']}))

fastify.get('/logout',
    async(req,res) => {
        req.logout()
        return {success:true}
    }
)

fastify.listen(3000)