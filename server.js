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
    res.send("jiji")
});

app.listen(port,()=>{
    console.log(`app on ${port}`)
})