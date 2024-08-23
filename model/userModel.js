const mongoose = require("mongoose");
const schema = mongoose.Schema

const userSchema = new schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true, 
    },
    username: {
        required: true,
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true,
    }
})

module.exports = mongoose.model("user", userSchema)
// in database, the collection name will be Users
// since we have directly exported it, the name of modal will be name of the file