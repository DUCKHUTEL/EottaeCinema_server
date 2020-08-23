const express = require("express");
const app = express();
let port = process.env.PORT || 9000;

app.get("/",(req,res)=> {
    res.send("jiji")
});

app.listen(port,()=>{
    console.log(`app on ${port}`)
})