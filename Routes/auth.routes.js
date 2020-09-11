const {verifySignUp} = require("../middleware");
const controller = require("../Controllers/auth.controller");

module.exports = function(app) {
  app.use(function (req,res,next){
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  app.post(
    "/signUp",
    [
      verifySignUp.checkIdDuplicate,
      verifySignUp.checkNickNameDuplicate
    ],
    controller.signUp
  );
  app.post("signIn",controller.signIn);
}