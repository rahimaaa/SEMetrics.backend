function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    console.log("Unauthorized");
  }
}

module.exports = ensureAuthenticated;
