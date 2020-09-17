const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const config = require("./config/auth.config")
const cors = require('cors');
app.use(cors());

app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", '*');
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
//   next();
// });

let port = process.env.PORT || 9000;

function checkToekn(res,token){
  if(!token){
    return res.send({message:"no token"})
  };
  // 토큰 유효성 검사
  const reqToken = token.slice(7);
  
  jwt.verify(reqToken,config.secret,(err,decoded)=>{
    if(err){
      return res.send({
        tokenState: false
      });
    }
    console.log(decoded);
  });
}
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
// 최초 토큰 체크
app.get("/checkToken", async(req,res)=> {
  checkToekn(res,req.headers.authorization);
  res.send({tokenState:true})
})

// 영화
app.get("/movies",async(req,res)=> {
  try{
    const query = `select * from heroku_18c5f24897f4cf6.moivesinfo;`
    const moviesInfo = await connectDb.query(query);
    return res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
    res.send(e);
    return
  }
});
// 영화관
app.get("/theater",async(req,res)=> {
  try{
    const query = `select * from heroku_18c5f24897f4cf6.location;`
    const moviesInfo = await connectDb.query(query);
    return res.send(moviesInfo[0]);
  }catch(e){
    console.log(e)
    res.send(e);
    return
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
    return res.send(moviesInfo[0]);
  }catch(e){
    return res.send(e);
  }
});

//회원가입시 아이디 중복체크
app.get("/checkRedunId",async(req,res)=>{
  const {id} = req.query;
  try{
    const query = `SELECT id from heroku_18c5f24897f4cf6.user where id = "${id}";`
    const checkIdres = await connectDb.query(query);
    const canUseId = checkIdres[0].length === 0 ? true:false
    console.log(canUseId)
    return res.send(canUseId);
  }catch(e){
    res.send(e);
    return
  }
});
// 닉네임 중복 체크
app.get("/checkRedunNickName",async(req,res)=>{
  const {nickName} = req.query;
  try{
    const query = `SELECT nickName from heroku_18c5f24897f4cf6.user where nickName = "${nickName}";`
    const checkIdres = await connectDb.query(query);
    const canUseNickName = checkIdres[0].length === 0 ? true:false
    return res.send(canUseNickName);
  }catch(e){
    res.send(e)
    console.log(e)
    return
  }
});
// 추가하기
app.post("/signUp",async(req,res)=>{
  try{
    const {id,password,nickName} = req.body;
    const query = `INSERT INTO heroku_18c5f24897f4cf6.user values("${nickName}","${password}","${id}");`;
    await connectDb.query(query);
    return res.send({status:true});
  }catch(e){
    res.send(e);
    return
  }
});
// 로그인
app.post("/signIn",async(req,res)=>{
  try{
    const {id,password} = req.body;
    const query = `select * from heroku_18c5f24897f4cf6.user where id="${id}" and password="${password}";`;
    const findIdData = await connectDb.query(query);

    if(findIdData[0].length === 0){
      res.send({loginStatus:false})
      return
    }          
    const token = jwt.sign({nickName:findIdData[0][0].nickName},config.secret,{
      expiresIn:86400
    });
    console.log("1")
    return res.send({
      nickName:findIdData[0][0].nickName,
      accessToken:token
    })
  }catch(e){
    res.send(e)
    return
  }
});
// 예매하기
app.post("/book",async(req,res)=>{
  checkToekn(res,req.headers.authorization);
  // 예매 정보 추가
  try{
    const {nickName, bookId, bookedSeat, selectedSeat} = req.body;
    const bookQuery = `insert into booktable values(null,"${nickName}",${bookId},'${selectedSeat}',now());`;
    await connectDb.query(bookQuery);
    // 기존 정보에 좌석 정보 추가하기

    const newBookedSeatCnt = bookedSeat.split(";").length;
    const updateQuery = `update heroku_18c5f24897f4cf6.theaters set bookedSeat=${bookedSeat},
    bookedSeatCnt=${newBookedSeatCnt} where bookId = ${bookId}`
    const update = await connectDb.query(updateQuery);

    return res.send({bookRes:true})
  }catch(e){
    console.log(e);
    res.send(e)
    return
  }
})
// 예매 취소
app.post("/cancelBook",async (req,res)=>{
  checkToekn(res,req.headers.authorization);
  try{
    const {bookTableId, bookId, bookedSeat} = req.body;
    const getBookSeatQuery = `select bookedSeat from heroku_18c5f24897f4cf6.theaters where bookId = ${bookId}`;
    const getBookSeat = await connectDb.query(getBookSeatQuery);
    const getBookSeatArray = getBookSeat[0][0].bookedSeat.split(";");
    const bookedSeatArray = bookedSeat.split(";");
    const setSeat = getBookSeatArray.filter(bookedSeat => {
      return !bookedSeatArray.includes(bookedSeat)
    }).join(";");

    const setBookSeatQuery = `update heroku_18c5f24897f4cf6.theaters set bookedSeat= '${setSeat}' where bookId = ${bookId};`
    const setBookSeat = await connectDb.query(setBookSeatQuery);
    console.log(setBookSeat)
    const deleteBookQuery = `delete from heroku_18c5f24897f4cf6.booktable where id = ${bookTableId}`
    const deleteBook = await connectDb.query(deleteBookQuery);
    console.log(deleteBook)
    res.send({state: true})
  }catch(e){
    res.send(e)
  }
})
// 관람평 최신으로 가져오기
app.get("/boardOnTime",async(req,res)=>{
  const {movie,count} = req.query;
  try{
    const query = `SELECT *,count(*) as total FROM heroku_18c5f24897f4cf6.debate where movie = '${movie}' order by created_at DESC limit ${count*10};`;
    const getBoard = await connectDb.query(query);
    console.log(query)
    console.log(getBoard[0])
    return res.send(getBoard[0])
  }catch(e){
    res.send(e)
    return
  }
});
// 관람평 공감으로 가져오기
app.get("/boardOnFavor",async(req,res)=>{
  const {movie,count} = req.query;
  try{
    const query = `SELECT *,count(*)  FROM heroku_18c5f24897f4cf6.debate where movie = '${movie}' order by favorit DESC limit ${count*10};`;
    const getBoard = await connectDb.query(query);
    return res.send(getBoard[0])
  }catch(e){
    res.send(e)
    return
  }
});

//관람평 쓰기
app.post("/appBoard",async (req,res)=> {
  checkToekn(res,req.headers.authorization);
  const {movie,starPoint,content,nickName} = req.body;
  try{
    const query = `insert into heroku_18c5f24897f4cf6.debate values(null,'${movie}',${starPoint},'${content}','${nickName}',0,now(),null,"");`
    await connectDb.query(query);
    res.send({update:true});
  }catch(e){
    res.send(e);
    return
  }
});

// 종아요 누르기
app.post("/like",async (req,res)=> {
  checkToekn(res,req.headers.authorization);
  // 누르기 기능
  const {id, status, whoLikeThis} = req.body;
  try{
		if(status==="like"){
			const query = `update heroku_18c5f24897f4cf6.debate 
			set favorit=favorit + 1,whoLikeThis='${whoLikeThis}' where id = ${id};`
			return res.send({message:"update"})
		}else if(status==="disLike"){
			const query = `update heroku_18c5f24897f4cf6.debate  
			set favorit=favorit -1,whoLikeThis='${whoLikeThis}' where id = ${id};`
			return res.send({message:"update"})
		}
  }catch(e){
    res.send(e)
  }
})
// 게시판 수정
app.patch("/patchBoard",async (req,res)=> {
  checkToekn(res,req.headers.authorization); 
  const {id,starPoint,content} = req.body;
  try{
    const query = `update heroku_18c5f24897f4cf6.debate 
			set content='${content}'star=${starPoint} where id = ${id};`
    await connectDb.query(query);
    return res.send({update:true});
  }catch(e){
    res.send(e);
    return
  }
})
// 게시판 삭제
app.delete("/deleteBoard",async (req,res)=> {
  
  checkToekn(res,req.headers.authorization);

  const {id} = req.body;
  try{
		const query = `delete from heroku_18c5f24897f4cf6.debate where id=${id}`;
		await connectDb.query(query);
		res.send({update:true});
  }catch(e){
    res.send(e)
  }
})

app.listen(port,()=>{
    console.log(`app on ${port}`)
});

