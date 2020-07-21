const path = require("path");
const fs = require("fs");

// helper to delete image
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  // 'unlink' function from 'fs' module delete a file
  fs.unlink(filePath, (err) => console.log(err));
};

exports.clearImage = clearImage;
