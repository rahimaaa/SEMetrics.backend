exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    console.log("Logout successful in req.logout");

    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
        res.status(500).send("Error occurred during logout");
      } else {
        res.clearCookie("connect.sid");
        res.send("Logout successful");
      }
    });
  });
};
