const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const user = db.user;

const verifyToken = (req,res,next) => {
  let token = req.headers["x-access-token"];
  if (!token){
    return res.stauts(403).send({
      message:"no token"
    })
  }
  jwt.verify(token, config.secret,(err,decoded)=>{
    if(err){
      return res.status(401).send({
        message:'auth error'
      })
    }
    req.Id = decoded.id;
    next()
  })
}

const authJwt = {
  verifyToken:verifyToken
}
module.exports = authJwt;
