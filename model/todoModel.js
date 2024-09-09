const mongoose = require("mongoose");
const schema = mongoose.Schema;

const todoSchema = new schema(
  {
    todo: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 100,
      trim: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("todo", todoSchema)
