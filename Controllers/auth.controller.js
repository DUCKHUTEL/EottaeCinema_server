const db = require("../models");
const config = require("../config/auth.config");
const user = db.user;

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signUp = (req,res) => {
  user.create({
    nickName:req.body.nickName,
    password: req.body.password,
    id: req.body.id
  }).then(user => {
    res.send({message:"회원가입 완료"});
  }).catch(e=>{
    res.status(500).send({message:e.message})
  })
};
exports.signIn = (req,res)=>{
  user.findOne({
    where:{
      id:req.body.id
    }
  }).then(user => {
    if(!user){
      return res.status(404).send({message:'user not found'});
    };
    const validPassword = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if(!validPassword){
      return res.status(401).send({
        accessToken:null,
        massage:"유요하지 않은 비밀번호입니다."
      });
    };
    const token = jwt.sign({id:user.id},config.secret,{
      expiresIn: 86400
    });
    res.status(200).send({
      nickName:user.nickName,
      accessToken:token
    });
  }).catch(err => {
    res.status(500).send({message:err.message});
  });
};


