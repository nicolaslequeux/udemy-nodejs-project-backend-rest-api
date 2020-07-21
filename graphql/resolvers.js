const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

// Import mongoose models
const User = require("../models/user");
const Post = require("../models/post");

// Resolver in an exported object where we define methods for every query/mutation defined in th schema
module.exports = {

  createUser: async function ({ userInput }, req) {
    //   const email = args.userInput.email;
    // WAY #1 TO MANAGE VALIDATIONS FROM RESOLVER
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is not valid" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 3 })
    ) {
      errors.push({ message: "Password is too short" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      // I can add my array of errors to my data field
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User already exists!");
      throw error;
    }
    const hashedPwd = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPwd,
    });
    const createdUser = await user.save();

    // _doc returns all user object data without the meta data of mongoose
    // I overright the _id property from objectId field to a string field for graphql
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Passwod is incorrect");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "secret_string", // Private key only known from server !!
      { expiresIn: "1h" } // if stolen... limited validity
    );
    return { token: token, userId: user._id.toString() };
  },

  createPost: async function ({ postInput }, req) {
    // TOCKEN CHECK (MANAGED BY HELPER AUTH.JS)
    if (!req.isAuth) {
      const error = new Error("Not authenticated");
      error.code = 401;
      throw error;
    }

    // VALIDATION - Use an empty errors array
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 3 })
    ) {
      errors.push({ message: "Title is not valid" });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is not valid" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      // I can add my array of errors to my data field
      error.data = errors;
      error.code = 422;
      throw error;
    }

    // EXTRACT USER
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user");
      error.code = 401;
      throw error;
    }

    // CREATE POST
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });

    // UPDATE DB
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    // RETURN POST DATA
    return {
      ...createdPost._doc,
      // I cannot return a mongoDB objectId, thus converting to string
      _id: createdPost._id.toString(),
      // graphql doesn't understand date type, thus this string convertion
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },

  posts: async function ({ page }, req) {
    // TOCKEN CHECK (MANAGED BY HELPER AUTH.JS)
    if (!req.isAuth) {
      const error = new Error("Not authenticated");
      error.code = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    return {
      // I return the expected object defined into the graphql schema
      posts: posts.map((post) => {
        return {
          ...post._doc,
          // I need to transform/overide some fields of the mongodb post for graphql (.map)
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },

  post: async function ({ id }, req) {
    // Is user authenticated?
    if (!req.isAuth) {
      const error = new Error("Not authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      // I need to transform/overide some fields of the mongodb post for graphql (.map)
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

};
