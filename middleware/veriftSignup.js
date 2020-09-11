const db = require("../models");
const user = db.user;

const checkIdDuplicate = (req,res,next)=>{
  user.findOne({
    where:{
      id:req.body.id
    }
  }).then(user =>{
    if(user){
      res.status(400).send({
        message:"alread exist Email"
      });
      return
    }
    next()
  })
}

const checkNickNameDuplicate = (req,res,next) => {
  user.findOne({
    where:{
      nickName:req.body.nickName
    }
  }).then(user => {
    if(user){
      res.status(400).send({
        message:'alread exist nickName'
      })
      return
    }
    next()
  })
}

const checkDuplicate = {
  checkIdDuplicate:checkIdDuplicate,
  checkNickNameDuplicate:checkNickNameDuplicate
}

module.exports = checkDuplicate