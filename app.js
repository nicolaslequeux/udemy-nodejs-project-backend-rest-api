const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

// multer : configuration object for file body parser
const fileStorage = multer.diskStorage({
  // destination 'key' stores a function which takes the 'req' object, the 'file' multer detected and a cb when done
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  // we add another key to the diskStorage object which defines how file should be named
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// multer : helper to filter file type
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); // I accept the file
  } else {
    cb(null, false); // otherwise I refuse it
  }
};

//app.use(bodyParser.urlencoded()); // x-www-form-urlencoded
app.use(bodyParser.json()); // aplication/json (as named in the header)

// I register/use the multer middleware (image parser on incoming request with 'image' field)
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// serve '/image' folder a the root with 'static' middleware from Express
// from now I can now see image folder from browser url
app.use("/images", express.static(path.join(__dirname, "images")));

// I create a general middleware to set the Header to allow CORS
app.use((req, res, next) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // '*' is a wild card to allow all domains
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// I only forward incoming requests which start with '/feed'
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// Error handling middleware : this middleware should never be reached, as the latest, exept if an error object is created!
app.use((error, req, res, next) => {
  console.log("error:", error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    // "mongodb+srv://nico-test:nico123test@nodejs-bookstore-qqnku.mongodb.net/shop"
    "mongodb+srv://nico-test:nico123test@nodejs-bookstore-qqnku.mongodb.net/messages?retryWrites=true",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
