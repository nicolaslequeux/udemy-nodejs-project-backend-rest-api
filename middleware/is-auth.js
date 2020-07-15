const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // I get back the header which hold the token, with 'get'
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Header not valid, missing Authorization");
    error.statusCode = 401;
    throw error;
  }
  // I split the space after key word "bearer " and get the following token
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secret_string");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  // I know the token is valid, I can store it in the request o be able to use it in other places
  // The decodedToken holds the userId that I will use, so I pass it to req
  req.userId = decodedToken.userId;
  next();
};
