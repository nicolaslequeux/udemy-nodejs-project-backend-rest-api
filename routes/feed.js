const express = require("express");

const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post(
  "/post",
  isAuth,
  [
    body("title").isString().isLength({ min: 5, max: 50 }).trim(),
    body("content").trim().isLength({ min: 5, max: 50 }),
  ],
  feedController.postPost
);

// GET /feed/post/1
router.get("/post/:postId", isAuth, feedController.getPost);

// browsers do not offer 'put'
router.put(
  "/post/:postId",
  isAuth,
  [
    body("title").isString().isLength({ min: 5, max: 50 }).trim(),
    body("content").trim().isLength({ min: 5, max: 50 }),
  ],
  feedController.updatePost
);

// delete http method (no body with delete verb, but I can encode data in the url)
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
