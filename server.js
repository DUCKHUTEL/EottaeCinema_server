const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const config = require("./config/auth.config")
// const cors = require('cors');
// app.use(cors());

app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

let port = process.env.PORT || 9000;

const mysql = require("mysql2/promise");

const connectDb = mysql.createPool({
  host: "us-cdbr-east-02.cleardb.com"
  ,port: 3306
  ,user : "ba26f111c136d8"
  ,password : "efa96b0e"
  ,database : "heroku_18c5f24897f4cf6"
  ,connectionLimit: 10
})

app.get("/",(req,res)=> {
    res.send("데모 서버 입니다.")
});
// 영화
app.get("/movies",async(req,res)=> {
  try{
    const query = `select * from heroku_18c5f24897f4cf6.moivesinfo;`
    const moviesInfo = await connectDb.query(query);
    res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
    res.send(e);

  }
});
// 영화관
app.get("/theater",async(req,res)=> {
  try{
    const query = `select * from heroku_18c5f24897f4cf6.location;`
    const moviesInfo = await connectDb.query(query);
    res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
    res.send(e);

  }
});
// 예매 데이터
app.get("/bookMovieData",async(req,res)=> {
  const {date,title,point} = req.query
  const defineTitle = title === "없음" ? "t2.movieTitle" : `"${title}"`
  const definePonit = point === "없음" ? `""` : `"${point}"`
  const allPoint = "t2.theaterLocation"
  try{
    const query = 
    `SELECT t1.locationName, t2.*, t3.ageCut
    FROM location t1, theaters t2, moivesinfo t3
    WHERE t1.point = t2.theaterLocation 
    and t2.movieTitle = t3.movieTitle
    and t2.movieTitle=${defineTitle}
    and t2.moviedate="${date}"
    and t2.theaterLocation=${point==="전체"?allPoint:definePonit}
    order by t1.locationId asc, t2.theaterLocation asc
    ;`
    const moviesInfo = await connectDb.query(query);
    res.send(moviesInfo[0]);
  }catch(e){
    res.send(e);
  }
});
// 로그인
app.get("/checkRedunId",async(req,res)=>{
  const {id} = req.query;
  try{
    const query = `SELECT id from heroku_18c5f24897f4cf6.user where id = "${id}";`
    const checkIdres = await connectDb.query(query);
    const canUseId = checkIdres[0].length === 0 ? true:false
    res.send(canUseId);
  }catch(e){
    res.send(e)
  }
});

app.get("/checkRedunNickName",async(req,res)=>{
  const {nickName} = req.query;
  try{
    const query = `SELECT nickname from heroku_18c5f24897f4cf6.user where nickname = "${nickName}";`
    const checkIdres = await connectDb.query(query);
    const canUseNickName = checkIdres[0].length === 0 ? true:false
    res.send(canUseNickName);
  }catch(e){
    res.send(e)
    console.log(e)
  }
});

app.post("/signUp",async(req,res)=>{
  try{
    const {id,password,nickName} = req.body;
    const query = `INSERT INTO heroku_18c5f24897f4cf6.user values("${nickName}","${password}","${id}");`;
    const postres =  await connectDb.query(query);
    res.send({status:true});
  }catch(e){
    res.send(e);
  }
});

app.post("/signIn",async(req,res)=>{
  try{
    const {id,password} = req.body;
    const query = `select * from heroku_18c5f24897f4cf6.user where id="${id}" and password="${password}";`;
    const findIdData = await connectDb.query(query);

    if(findIdData[0].length === 0){
      res.send({loginStatus:false})
      return
    }          
    const token = jwt.sign({id:findIdData[0].id},config.secret,{
      expiresIn:86400
    });
    res.send({
      nickName:findIdData[0][0].nickName,
      accessToken:token
    })
  }catch(e){
    res.send(e)
  }
});
// 예매하기
app.post("/book",async(req,res)=>{
  // 토큰 존재확인
  if(!req.headers.authorization){
    return res.send({message:"no token"})
  };
  // 토큰 유효성 검사
  const reqToken = req.headers.authorization.slice(7);
  jwt.verify(reqToken,config.secret,(err,decoded)=>{
    if(err){
      return res.send({
        message: "Unauthorized!"
      });
    }
    console.log(decoded);
  })
  // 예매 정보 추가
  try{
    const {nickName, bookId, bookedSeat, selectedSeat} = req.body;
    const bookQuery = `insert into booktable values(null,"${nickName}",${bookId},'${selectedSeat}',now());`;
    const finishBook = await connectDb.query(bookQuery);
    // 기존 정보에 좌석 정보 추가하기

    const newBookedSeatCnt = bookedSeat.split(";").length;
    const updateQuery = `update heroku_18c5f24897f4cf6.theaters set bookedSeat=${bookedSeat},
    bookedSeatCnt=${newBookedSeatCnt} where bookId = ${bookId}`
    const update = await connectDb.query(updateQuery);

    res.send(update[0])
  }catch(e){
    console.log(e);
    res.send(e)
  }
})
// 관람평 최신으로 가져오기
app.get("/boardOnTime",async(req,res)=>{
  const {movie,count} = req.query;
  try{
    const query = `SELECT * FROM heroku_18c5f24897f4cf6.debate where movie = '${movie}' order by created_at DESC limit ${count*10};`;
    const getBoard = await connectDb.query(query);
    res.send(getBoard[0])
  }catch(e){
    res.send(e)
  }
});
// 관람평 공감으로 가져오기
app.get("/boardOnFavor",async(req,res)=>{
  const {movie,count} = req.query;
  try{
    const query = `SELECT * FROM heroku_18c5f24897f4cf6.debate where movie = '${movie}' order by favorit DESC limit ${count*10};`;
    const getBoard = await connectDb.query(query);
    res.send(getBoard[0])
  }catch(e){
    res.send(e)
  }
});

//관람평 쓰기
app.post("/appBoard",async (req,res)=> {
  // 토큰 존재 확인
  if(!req.headers.authorization){
    return res.send({message:"no token"})
  };
  // 토큰 유효성 검사
  const reqToken = req.headers.authorization.slice(7);
  
  jwt.verify(reqToken,config.secret,(err,decoded)=>{
    if(err){
      return res.send({
        message: "Unauthorized!"
      });
    }
    console.log(decoded);
  });

  const {movie,starPoint,content,nickName} = req.body;
  try{
    const query = `insert into heroku_18c5f24897f4cf6.debate values(null,'${movie}',${starPoint},'${content}','${nickName}',0,now(),null);`
    const postBoard = await connectDb.query(query);
    res.send({update:true});
  }catch(e){
    res.send(e)
  }
})

// 종아요 누르기
app.post("/like",async (req,res)=> {
  // 토큰 존재 확인
  if(!req.headers.authorization){
    return res.send({message:"no token"})
  };
  // 토큰 유효성 검사
  const reqToken = req.headers.authorization.slice(7);
  jwt.verify(reqToken,config.secret,(err,decoded)=>{
    if(err){
      return res.send({
        message: "Unauthorized!"
      });
    }
    console.log(decoded);
  });
  // 누르기 기능
  const {id} = req.body;
  const query = `update heroku_18c5f24897f4cf6.debate set favorit= favorit+1 where id = ${id}`
})

app.listen(port,()=>{
    console.log(`app on ${port}`)
})