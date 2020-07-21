const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
// I import express-graphql to expose graphql schema and resolvers
const { graphqlHTTP } = require("express-graphql");

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");

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
  // BROWSER SEND 'OPTION' REQ FIRST BEFORE ANY VERBS, BUT EXPRESS-GRAPHQL REFUSES IT
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to extract/check token id for every request that reach my graphql endpoint, but will not deny the request if there is no token
app.use(auth);

// Route API for image managing (could be outsourced in another file, but only route for images!)
app.put("/post-image", (req, res, next) => {
  // I protect my route from unauthenticated people
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }
  // Is-there a file attached to the request?
  if (!req.file) {
    return res.status(200).json({ message: "No file provided" });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: "File stored", filePath: req.file.path });
});

// Graphql middleware only entrypoint, deliberatly not limited to 'app.post()' to be able to use graphiql tool
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    // graphql method which receive error to overight error format
    customFormatErrorFn(err) {
      // return err; // means no change into the format
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occurred.";
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    },
  })
);

// Error handling middleware : this middleware should never be reached, as the latest, exept if an error object is created!
app.use((error, req, res, next) => {
  console.log("ERROR FROM APP.JS:", error);
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

// helper to delete
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  // 'unlink' function from 'fs' module delete a file
  fs.unlink(filePath, (err) => console.log(err));
};
