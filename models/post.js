const mongoose = require("mongoose");

// I extract the Schema constructor from the mongoose object
const Schema = mongoose.Schema;

// I create my Post model
const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  // I can pass option to the schema constructor, mongoose will now manage createdAt and updatedAt
  { timestamps: true }
);

// Mongoose will tranform 'Post' model in lower case + plurial to name the collection! (posts)
module.exports = mongoose.model("Post", postSchema);
