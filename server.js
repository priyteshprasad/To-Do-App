// IMPORTS
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session); //session will be used to create login session

// file imports
const { userDataValidator, isEmailValid } = require("./utils/authUtils");
const userModel = require("./model/userModel");
const isAuth = require("./middleware/isAuth");
const todoModel = require("./model/todoModel");
const { createTodo, getUsersTodo } = require("./controller/todo");
const todoDataValidation = require("./utils/todoUtils");

// CONSTANTS
const PORT = process.env.PORT || 8000;
const app = express();
const store = new mongodbSession({
  uri: process.env.MONGO_URI_0,
  collection: "sessions",
}); //collection name will be plural

// DB CONNECTION
mongoose
  .connect(process.env.MONGO_URI_0)
  .then(() => {
    console.log("mongodb connected successfully");
  })
  .catch((error) => {
    console.log(error);
  });

// MIDDLEWARE
app.set("view engine", "ejs"); // so that we can use same port for frontend when html is recieved as response
app.use(express.urlencoded({ extended: true })); //middleware used to decode url encoding
app.use(express.json()); //middleware use to access jeson request
app.use(
  session({
    secret: process.env.SECRET_KEY,
    store: store,
    resave: false,
    saveUninitialized: false, // these tow are to avoid depricated error
  })
);
app.use(express.static("public"));
// Above line is to avoid the error: Refused to execute script from 'http://localhost:8000/browser.js' because its MIME type ('text/html') is not executable, and strict MIME type checking is enabled.

app.get("/", (req, res) => {
  return res.send("Server is running...");
});
app.get("/test", (req, res) => {
  return res.render("test.ejs");
});
app.get("/register", (req, res) => {
  return res.render("registerPage");
});

// POST APIs
app.post("/register", async (req, res) => {
  const { name, email, username, password } = req.body;
  // data validation
  try {
    await userDataValidator({ name, email, username, password });
    // if resolved then we willl get to the next
    // if rejected then we will go to the catch and reason we will get in error
  } catch (error) {
    // if invalid data, return the error from catch
    return res.status(400).json(error);
  }
  // check is email and username exists
  try {
    const userEmailExists = await userModel.findOne({ email: email });
    if (userEmailExists) {
      return res.status(400).json(`Email already exists: ${email}`);
    }
    const userUsernamExists = await userModel.findOne({ username });
    if (userUsernamExists) {
      return res.status(400).json(`Username already exists: ${username}`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
  // New user
  // hashed password
  const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT));
  // create an object of user schema
  const userObj = new userModel({
    name,
    username,
    email,
    password: hashedPassword,
  });

  // database operation
  try {
    const userDb = await userObj.save(); //store the data in DB
    // return res.status(201).json({
    //     message: "User created successfully",
    //     data: userDb
    // });
    return res.redirect("/login");
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: "Internal server error",
      error: error,
    });
  }
});
app.get("/login", (req, res) => {
  return res.render("loginPage");
});
app.post("/login", async (req, res) => {
  const { loginId, password } = req.body;
  //   console.log(req.body);
  if (!loginId || !password) {
    return res.status(400).json({ message: "Missing user credentials" });
  }
  try {
    // check if user exists
    let userDb = {};
    if (isEmailValid({ key: loginId })) {
      //user has used email for login
      userDb = await userModel.findOne({ email: loginId });
    } else {
      //user has used username for login
      userDb = await userModel.findOne({ username: loginId });
    }
    if (!userDb) {
      //no user found
      return res
        .status(400)
        .json({ message: "user not found, please register first" });
    }
    // compare password
    // console.log("user", userDb);
    const isMatch = await bcrypt.compare(password, userDb.password); //compare encripted password with recieved
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });
    // console.log(req.session);

    req.session.isAuth = true; //by adding this, we update the session in mongodb
    req.session.user = {
      userId: userDb._id,
      username: userDb.username,
      email: userDb.email,
    };
    return res.redirect("/dashboard");
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
});
app.get("/dashboard", isAuth, (req, res) => {
  return res.render("dashboardPage");
});

app.post("/logout", isAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    return res.redirect("/login");
  });
});

app.post("/logout-out-from-all", isAuth, async (req, res) => {
  //user
  console.log(req.session);
  const username = req.session.user.username;
  //   create session schema
  const sessionSchema = new mongoose.Schema({ _id: String }, { strict: false });
  // convert schema into model
  const sessionModel = mongoose.model("session", sessionSchema);
  // perform model query
  try {
    const deleteDb = await sessionModel.deleteMany({
      "session.user.username": username,
    });
    console.log(deleteDb);
    return res.status(200).json({
      message: "Logout from all the devices successfull",
      data: deleteDb,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
});

app.post("/create-item", isAuth, createTodo);

app.get("/read-item", isAuth, getUsersTodo);

app.post("/edit-item", isAuth, async (req, res) => {
  console.log(req.body);
  const { newData, todoId } = req.body;
  const username = req.session.user.username;
  if (!todoId) {
    return res.send({
      status: 400,
      message: "missing todoId",
    });
  }
  // data validation
  try {
    await todoDataValidation({ todo: newData });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }
  // find the todo from db with todoId
  try {
    const todoDb = await todoModel.findOne({ _id: todoId });
    if (!todoDb) {
      return res.send({
        status: 400,
        message: `No todo present with this todoId : ${todoId}`,
      });
    }
    // ownwership check
    if (username !== todoDb.username) {
      return res.send({
        status: 403,
        message: "Not allowed to edit the todo",
      });
    }
    // update the todo
    const todoUpdatedDb = await todoModel.findOneAndUpdate(
      { _id: todoId },
      { todo: newData },
      { new: true }
    );
    return res.send({
      status: 200,
      message: "Todo updated successfully",
      data: todoUpdatedDb
    })
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});


app.post("/delete-item", isAuth, async (req, res)=>{
  const todoId = req.body.todoId;
  const username = req.session.user.username;

  if(!todoId){
    return res.send({
      status: 400,
      message: "Missing todo ID"
    })
  }
  try {
    // get the todoDbObj
    const todoDb = await todoModel.findOne({_id: todoId})
    if(!todoDb){
      return res.send({
        status: 400,
        message: `No todo found with todoId: ${todoId}`,
      })
    }
    if(todoDb.username !== username){
      return res.send({
        status: 403,
        message: "Not allowed to delete the todo."
      })
    }

    const todoDeletedDb = await todoModel.findOneAndDelete({_id: todoId})
    return res.send({
      status: 200,
      message: "Todo deleted successfully",
      data: todoDeletedDb
    })
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal Servel Error",
      error: error
    })
  }
})
app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
});
