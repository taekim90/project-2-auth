const express = require('express')
const router = express.Router()
const db = require('../models')
const bcrypt = require('bcrypt')
const cryptojs = require('crypto-js')
require('dotenv').config() 


router.get('/profile', (req, res) => {
    res.render('users/profile.ejs')
})

router.get('/new', (req,res) => {
    res.render('users/new.ejs')
})

router.post('/', async (req,res) => {
    const [newUser, created] = await db.user.findOrCreate({ // await db.user.findOrCreate will return 2 values. created info & boolean
                                                            // find or create always returns an array with 2 values in it
        where: {email: req.body.email}
        // where: {email: req.body.email, password: hashedPassword} // DONT DO THIS - if my password is different but the email is the same, then we would still be able to create
    })
    if(!created) { // if this user already exists / if the user was not created
        console.log('User already exits')
        // render the login page and send an appropriate message
    } else {
        // hash the user
        const hashedPassword = bcrypt.hashSync(req.body.password, 10) // takes 2 variables - plain text password & number of salt rounds
        // newUser.password = req.body.password // newUser comes from ^ there
        newUser.password = hashedPassword // now we change req.body.password to hashedPassword
                                          // this prevents us from knowing what the users password ever is

        await newUser.save() // if it's a database transaction, good to put an await

        // encrypt the user id via AES (advanced encryption standard)
        const encryptedUserId = cryptojs.AES.encrypt(newUser.id.toString(), process.env.SECRET) // this says please encrypt the following using the AES
        const encryptedUserIdString = encryptedUserId.toString()
        console.log(encryptedUserIdString)
        // store the encrypted id in the cookie of the res obj
        res.cookie('userId', encryptedUserIdString)
        // redirect back to home page
        res.redirect('/')
    }
    // console.log(newUser)
})

router.get('/login', (req, res) => {
    res.render('users/login.ejs', {error: null})
})

router.post('/login', async (req, res) => {
    const user = await db.user.findOne({where: {email: req.body.email}})
    if(!user) {
        console.log('user not found!') // didn't find the user
        res.render('users/login.ejs', {error: 'Invalid email/password'}) // reason we do the res.render of the login.ejs is so that we can pass in an error message.
    } else if (!bcrypt.compareSync(req.body.password, user.password)) { // compares the password to the password in the database
        console.log('incorrect password') // found email but password is wrong
        res.render('users/login.ejs', {error: 'Invalid email/password'}) // send them back to login page
    } else {
        console.log('logging in the user!')
        // encrypt the user id via AES (advanced encryption standard)
        const encryptedUserId = cryptojs.AES.encrypt(user.id.toString(), process.env.SECRET) // this says please encrypt the following using the AES
                                                                                                // takes 2 arguments. second one is a secret.
        const encryptedUserIdString = encryptedUserId.toString() 
        console.log(encryptedUserIdString)
        // store the encrypted id in the cookie of the res obj
        res.cookie('userId', encryptedUserIdString)
        // redirect back to home page
        res.redirect('/')
    }
})

router.get('/logout', (req, res) => {
    console.log('logging out')
    res.clearCookie('userId')
    res.redirect('/')
})

// export all these routes to the entry point file
module.exports = router



// render says to send an data objects to the ejs page
// redirect says to go ping another get route
// if you need an entire route to run. e
// render vs redirect. is if you need to render the th