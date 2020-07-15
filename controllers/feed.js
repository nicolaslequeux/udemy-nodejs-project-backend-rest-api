const fs = require("fs");
const path = require("path");

// validationResult function collects all results from validation error on the route
const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2; // same value assigned on the frontend
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successful",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500; // server side error
    }
    next(err);
  }
};

exports.postPost = async (req, res, next) => {
  const errors = validationResult(req); // I collect my errors
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    // I add my own property on the error object
    error.StatusCode = 422;
    // throw will immediatly exit the function execution and will look for first error handling function or middleware (catch block) provided in express
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 422;
    // next(error); Uniquement s'il existe un catch dans la fonction, sinon throw
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  // 'path' variable is defined by multer on the 'file' key, also defined by multer
  const imageUrl = req.file.path;

  // I create a new post with Post model as a constructor
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: "Post created successfully!",
      // The 'post' is the result object I get back from 'save'
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    if (!err.StatusCode) {
      err.statusCode = 500; // server side error
    }
    // Inside a Promise chain, throwing an error will not work, I have to use the 'next' middleware and pass the error to it, to reach the next express error middleware
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      // I 'throw' the error to reach the next 'catch' block which here will manage the error
      throw error;
    }
    res.status(200).json({
      message: "Post fetched",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500; // server side error
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req); // I collect my errors
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    // I add my own property on the error object
    error.statusCode = 422;
    // throw will immediatly exit the function execution and will look for first error handling function or middleware (catch block) provided in express
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image; // if there is no image which replace the old one
  if (req.file) {
    // if there is a file into the body, then take this new one!
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No file image selected");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      // I 'throw' the error to reach the next 'catch' block which here will manage the error
      throw error;
    }
    // Event if I have a post, I want to check the update belongs to the post creator
    if (post.creator.toString() !== req.userId) {
      const error = new Error("User no authorized!");
      error.statusCode = 404;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    const result = await post.save();
    res.status(200).json({
      message: "Post updated successfully!",
      post: result,
    });
  } catch {
    if (!err.statusCode) {
      err.statusCode = 500; // server side error
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("User no authorized!");
      error.statusCode = 404;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    res.status(200).json({
      message: "Post deleted!",
    });
  } catch {
    if (!err.statusCode) {
      err.statusCode = 500; // server side error
    }
    next(err);
  }
};

// helper to delete
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  // 'unlink' function from 'fs' module delete a file
  fs.unlink(filePath, (err) => console.log(err));
};
