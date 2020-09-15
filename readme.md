## 예린님을 위한 로그인 API 사용 완벽 가이드 @yealin choi

## 0. 토큰 체크

```jsx
app.get("/checkToken", async(req,res)=> {
  checkToekn(req.headers.authorization);
  res.send({tokenState:true})
})

function checkToekn(token){
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
```

## 1 . 회원가입

### 1-1 아이디(이메일) 중복 검사

```jsx
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
```

[https://eottae-cinema.herokuapp.com/](https://eottae-cinema.herokuapp.com/)checkRedunId  > 로 post 요청

요청 시에 필요한 정보는 일단 이메일 중복 검사 니까 이메일만 넘겨주시면 됩니다.

요청 코드는 

Axios.post("[https://eottae-cinema.herokuapp.com/](https://eottae-cinema.herokuapp.com/)checkRedunId",{id}) ⇒ id:id 이니까

이렇게 보내면 서버에서 유저 테이블에 동일한 아이디가 있는 지 찾을 거에요 그리고 그 값이 있으면 false를 리턴해줄 겁니다. 없으면 즉 사용 가능하면 이죠 ? 그러면 true를 반환해줄거에요

### 1-2 닉네임 중복 검사

```jsx
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
```

닉네임도 동일하게 동작합니다

요청 코드는 

Axios.post("[https://eottae-cinema.herokuapp.com/](https://eottae-cinema.herokuapp.com/)checkRedunNickName",{nickName}) 

### 1-3 회원 정보 추가하기

```jsx
app.post("/signUp",async(req,res)=>{
  try{
    const {id,password,nickName} = req.body;
    const query = `INSERT INTO heroku_18c5f24897f4cf6.user values(
				"${nickName}","${password}","${id}"
		);`;
    const postres =  await connectDb.query(query);
    res.send({status:true});
  }catch(e){
    res.send(e);
  }
});
```

현재 서버 쪽 코드에요. 보시면 body 에서 id, password, nickName을 넘겨주면 되고 정상적으로 입력이 되면 status:true 라는 객체를 반환해줄거에여

```jsx
Axios.post("[https://eottae-cinema.herokuapp.com/](https://eottae-cinema.herokuapp.com/)signUp",{nickName,id,password})
```

Axios.post("[https://eottae-cinema.herokuapp.com/](https://eottae-cinema.herokuapp.com/)signUp",{nickName,id,password});

## 2. 로그인 하기

### 2-1 로그인

```jsx
app.post("/signIn",async(req,res)=>{
  try{
    const {id,password} = req.body;
    const query = `select * from heroku_18c5f24897f4cf6.user where 
																				id="${id}" and password="${password}"`;
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
```

앞서 추가한 아이디 비번을 가지고 로그인을 할 꺼에요 뭐 별거 없어요. 처음에 이제 보낸 아이디, 비번을 가지고 db에서 하나를 찾을 건데 그 결과가 없으면 .data  에 {loginStatus:false}라는 객체가 들어갈 거에요. 만약 성공했다면 닉네임과 토큰이 {
      nickName : nickName,
      accessToken : token
    } 이렇게 반환 될 겁니다~. 이제 이 토큰을 스토리지에 저장해주시면 되요. 토큰의 유요시간은 몇 시간이더라. 뭐 대충 24시간이라 생각하고 계심 됩니다.

보내는 주소

```jsx
Axios.post("https://eottae-cinema.herokuapp.com/signIn", {id,password});
```

토큰 유지시간은 하루

localStorage

```json

```

## 3. 예매하기

### 3-1 예매

```jsx
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
```

```jsx
export default class bookService{
	static async book(bookId,bookedSeat,selectedSeat,nickName,token);
	const bookFunction =	Axios.post("https://eottae-cinema.herokuapp.com/book",
		{bookId,bookedSeat,selectedSeat,nickName},
		{headers:{Authorization:`Bearer ${token}`}
	);
	return bookFunction.data
}
```

## 4. 동우님을 위한 게시판

### 4-1 게시판 가져오기

```jsx
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
```

서버쪽 코드에요. 보시면 해당 영화랑 카운트만 주면 되는데, 이 카운트는 시작이 1이어야해요, 더보기 버튼 누르면 카운트에 1 더해서 다시 서버로 요청하는 방식으로 진행하시면 됩니다.

```jsx
Axios.get("[https://eottae-cinema.herokuapp.com/](https://eottae-cinema.herokuapp.com/)boardOnTime",{movie,count});
```

정보는{id , movie, star , content, user, favorit, created_at, updated_at} 이렇게 넘어올거에요

### 4-2 게시글 쓰기

```jsx
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
 // 예매 테이블에 정보 있는 지 확인하기
	const {movie,starPoint,content,nickName} = req.body;
	const isYouWatchQuery = `select nickname from 
(select booktable.*, theaters.movieTitle from booktable,theaters where booktable.bookid = theaters.bookId) t1
where movieTitle='${movie}' and nickname='${nickName}';`
	try{
		const {movie,starPoint,content,nickName} = req.body;
		const isYouWatchQuery = `select nickname from 
			(select booktable.*, theaters.movieTitle 
			from booktable,theaters 
			where booktable.bookid = theaters.bookId) t1
			where movieTitle='${movie}' and nickname='${nickName}';`
		const checkYouWatch = await connectDb.query(isYouWatchQuery );
		if(checkYouWatch[0].length===0){
			res.send({watch:false})
		}
		
		// 드디어 쓰기
  
    const query = `insert into heroku_18c5f24897f4cf6.debate values(
			null,'${movie}',${starPoint},'${content}','${nickName}',0,now(),null
		);`
    const postBoard = await connectDb.query(query);
    res.send({update:true});
  }catch(e){
    res.send(e)
  }
})
```

헤더에 토큰을 넣고 영화명, 점수, 내용, 닉네임을 넘겨주시면 되요~ 완료되면 {update:true} 라는 객체가 반환될 거에여

```jsx
Axios.post("https://eottae-cinema.herokuapp.com/appBoard",  
  {movie,starPoint,content,nickName},
  {headers:{Authorization:`Bearer ${token}`}}
);
```

### 4-3 수정하기

```jsx
app.patch("/patchBoard",async (req,res)=> {
  
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

  const {id,starPoint,content} = req.body;
  try{
    const query = `update heroku_18c5f24897f4cf6.debate 
			set content='${content}'star=${startPoint} where id = ${id};`
    const postBoard = await connectDb.query(query);
    res.send({update:true});
  }catch(e){
    res.send(e)
  }
})
```

```jsx
Axios.patch("https://eottae-cinema.herokuapp.com/patchBoard",  
  {게시글의 아이디,starPoint,content},
  {headers:{Authorization:`Bearer ${token}`}}
);
```

간단합니다. 위의 내용으로 보내시면 대고

### 4-4 좋아요 버튼 클릭

```jsx
app.patch("/patchStar",async (req,res)=> {
  
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
```

```jsx
Axios.patch("https://eottae-cinema.herokuapp.com/patchStar",  
  {게시글의 아이디,status},
  {headers:{Authorization:`Bearer ${token}`}}
);
```

버튼 누를 때 현재 버튼의 상태에 따라서 안눌려져 있으면 like를 눌러져 있으면 disLike를 문자열로 보내주세요. 그리고 게시판의 정보 중에 whoLikeThis라는 게 있는데, 그게 좋아요 누른 사람들 문자열로 가지고 있는 거거든요. 그래서 안눌린 상태에서 누르면 누른 사람 아이디를 추가해서 보내주시면 되요.

```jsx
example 
whoLikeThis = "생수;소다;dtrox;"
whoLikeThis.split(";").filter({nick}=> nick!=="생수").join(";");

-> 승일이라는 닉이 누름
요청할 때 "생수;소다;dtrox;승일" 이렇게 추가해주세요

1. 게시판 데이터에 whoLikeThis가 있는데, 그 안에 현재 사용중인 닉네임이 있으면 
	status를 disLike, whoLikeThis를 filter해서 사용중인 닉네임을 제거 한 문자열을 보내기
	없으면
```

### 4-5 삭제

```jsx
app.delete("/deleteBoard",async (req,res)=> {
  
  checkToekn(req.headers.authorization);

  const {id} = req.body;
  try{
		const query = `delete from heroku_18c5f24897f4cf6.debate where id=${id}`;
		await connectDb.query(query);
		res.send({update:true});
  }catch(e){
    res.send(e)
  }
})
```

토큰이랑 아이디만 주시면 지워집니다. 대신 화면에서 닉네임이 글쓴이랑 같으면 수정 삭제 버튼이 보여야겠죠