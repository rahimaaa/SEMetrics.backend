exports.user = (req, res, next) => {
  const user = req.user;
  res.json(user);
};
