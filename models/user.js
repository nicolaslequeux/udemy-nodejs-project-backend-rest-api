const mongoose = require("mongoose");

// I extract the Schema constructor from the mongoose object
const Schema = mongoose.Schema;

// I create my Post model
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "I am new!",
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

// Mongoose will tranform 'Post' model in lower case + plurial to name the collection! (posts)
module.exports = mongoose.model("User", userSchema);
