function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    console.log("Unauthorized");
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = ensureAuthenticated;
