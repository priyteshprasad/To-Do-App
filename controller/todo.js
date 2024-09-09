const todoModel = require("../model/todoModel");
const todoDataValidation = require("../utils/todoUtils");


const createTodo = async (req, res) =>{
    console.log(req.body)
    const todo = req.body.todo;
    const username = req.session.user.username;
    // data validation
    try {
        await todoDataValidation({todo})
    } catch (error) {
        return res.status(400).json(error)
    }
    // create an entry in db
    const todoObj = new todoModel({todo, username})
    try {
        const todoDb = await todoObj.save();
        return res.status(201).send({
            status: 201,
            message: "Todo created successfully",
            data: todoDb,
          });
    } catch (error) {
        return res.status(500).send({
            status: 500,
            message: "Internal server error",
            error: error,
          });
    }
}
const getUsersTodo = async (req, res) => {
    const username = req.session.user.username;
    try {
        const todoList = await todoModel.find({username});
        if(todoList.length === 0){
            return res.send({
                status: 204, 
                message: "No Todo Found!!!"
            })
        }
        return res.send({
            status: 200,
            message: "Read success",
            data: todoList
        })
    } catch (error) {
        return res.send({
            status: 500,
            message: "Internal server error",
            error: error,
          }); 
    }
}

module.exports = {createTodo, getUsersTodo}