const router = require("express").Router();
    router.use("/", ()=>{
        res.send("In api")
    })
  router.use("/github", require("./github"));

  router.use((req, res, next) => {
    const error = new Error("404 Not Found");
    error.status = 404;
    next(error);
  });

  module.exports =  router;