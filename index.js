const express = require('express') // import express
const app = express() // create an express instance
const ejsLayouts = require('express-ejs-layouts') // import ejs layouts
require('dotenv').config() // allows us to access env vars
const cookieParser = require('cookie-parser')
const cryptoJS = require('crypto-js')
const db = require('./models/index.js')

// MIDDLEWARE
app.set('view engine', 'ejs') // set the view engine to ejs
app.use(ejsLayouts) // tell express we want to use layouts
app.use(cookieParser()) // gives us access to req.cookies
app.use(express.urlencoded({extended: false})) // body parser (to make req.body work)

// CUSTOM LOGIN MIDDLEWARE
// This just looks up the user based on the userId that's coming in from the cookie.
// res.locals is a property of the res object that starts off as an empty object on every request. 
// We can write stuff into this object, and in downstream functions we can access it as res.locals.whatever. 
// res.locals has another magic property: anything stored there is automatically available in all our views. 
// So we can just start referring to user in our views.
// If we don't invoke next, express doesn't know that it should keep the server.js relay race going.
app.use(async (req, res, next) => {
    if (req.cookies.userId) {
        // decrypting the incoming user id from the cookie
        const decryptedId = cryptoJS.AES.decrypt(req.cookies.userId, process.env.SECRET)
        // converting the decrypted id into a readable string
        const decryptedIDString = decryptedId.toString(cryptoJS.enc.Utf8) // tells it what type of characters to turn it into
        // then we are querying the database for the user with that id
        const user = await db.user.findByPk(decryptedIDString) // finds user with that primary key with the decrypted ID
        // we are assigning the user to res.locals.user in the routes and user in the ejs
        res.locals.user = user // this give us access to req.user on all routes and on all of our ejs pages we have access to all the users by the use of user
        // res.locals.taco = user
    } else res.locals.user = null
    next() // next is a callback that tells it to move on to the next middleware
})

// CONTROLLERS
app.use('/users', require('./controllers/users.js'))

// ROUTES
app.get('/', (req, res) => {
    res.render('home.ejs')
})

// you need to create a 404.ejs page
// * stands for a catch all / wild card
// app.get('*', (req, res) => {
//     res.render('404')
// })

// check for an env PORT, otherwise use 8000
const PORT = process.env.PORT || 8000 // if the process.env.PORT is undefined, it will default to local host 8000
app.listen(PORT, () => {
    console.log(`Auth app running on ${PORT}`)
})