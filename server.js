// IMPORTS
const express = require('express')
require('dotenv').config()
const mongoose = require('mongoose');
const userDataValidator = require('./utils/authUtils');
const userModel = require("./model/userModel")

// CONSTANTS
const PORT = process.env.PORT || 8000;
const app = express()

// DB CONNECTION
mongoose
    .connect(process.env.MONGO_URI_0)
    .then(()=>{console.log("mongodb connected successfully")})
    .catch((error)=>{console.log(error)})

// MIDDLEWARE
app.set("view engine", "ejs") // so that we can use same port for frontend when html is recieved as response
app.use(express.urlencoded({extended: true})) //middleware used to decode url encoding
app.use(express.json()) //middleware use to access jeson request
app.get("/", (req, res) =>{
    return res.send("Server is running...")
})
app.get("/test", (req, res)=> {
    return res.render("test.ejs")
})
app.get("/register", (req, res) =>{
    return res.render("registerPage")
})
app.post("/register", async (req, res)=>{
    const {name, email, username, password } = req.body;
    // data validation
    try {
        await userDataValidator({name, email, username, password})
        // if resolved then we willl get to the next 
        // if rejected then we will go to the catch and reason we will get in error
    } catch (error) {
        // if invalid data, return the error from catch
        return res.status(400).json(error)
    }
    // create an object of user schema
    const userObj = new userModel({
        name, username, email, password
    })

    // database operation
    try {
        const userDb = await userObj.save(); //store the data in DB
        return res.status(201).json({
            message: "User created successfully",
            data: userDb
        });
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            message: "Internal server error",
            error: error
        });
    }
});
app.get("/login", (req, res)=>{
    return res.render("loginPage")
})
app.post("/login", (req, res)=>{
    return res.send("login api is working");
})
app.get("/dashboard", (req, res) => {
    return res.render("dashboardPage");
  });
  

app.listen(PORT, ()=>{
    console.log("Server is running on port: ", PORT)
})