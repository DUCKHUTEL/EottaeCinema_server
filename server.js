const express = require("express");
const app = express();
// const cors = require('cors');
 
// const corsOptions = {
//   origin: 'http://localhost:3000', // 허락하고자 하는 요청 주소
//   credentials: true, // true로 하면 설정한 내용을 response 헤더에 추가 해줍니다.
// };

// app.use(cors(corsOptions));
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

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

app.get("/movies",async(req,res)=> {
  try{
    const query = `select * from heroku_18c5f24897f4cf6.moivesinfo`
    const moviesInfo = await connectDb.query(query);
    res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
  }
});

app.get("/theater",async(req,res)=> {
  try{
    const query = `select * from heroku_18c5f24897f4cf6.location`
    const moviesInfo = await connectDb.query(query);
    res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
  }
});

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

app.listen(port,()=>{
    console.log(`app on ${port}`)
})