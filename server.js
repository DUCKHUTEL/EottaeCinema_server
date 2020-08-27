const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

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
    console.log(moviesInfo[0]);
    res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
  }
});

app.get("/bookMovieData",async(req,res)=> {
  const {date,title,point} = req.query
  title === "" ? title="t2.movieTitle":title;
  point === "" ? point="t2.theaterLocation":point;
  try{
    const query = 
    `SELECT t1.locationName, t2.*, t3.ageCut
    FROM location t1, theaters t2, moivesinfo t3
    WHERE t1.point = t2.theaterLocation 
    and t2.movieTitle = t3.movieTitle
    and t2.movieTitle=${title}
    and t2.moviedate=${date}  
    and t2.theaterLocation=${point}
    order by t1.locationId asc, t2.theaterLocation asc
    ;`
    console.log(query);
    const moviesInfo = await connectDb.query(query);
    console.log(moviesInfo[0])
    res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
  }
});

app.listen(port,()=>{
    console.log(`app on ${port}`)
})