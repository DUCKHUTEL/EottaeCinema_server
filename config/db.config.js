module.exports = {
  HOST: "us-cdbr-east-02.cleardb.com",
  USER: "ba26f111c136d8",
  PASSWORD : "efa96b0e",
  DB: "heroku_18c5f24897f4cf6",
  dialect:"mysql",
  pool:{
    max: 10,
    min:0,
    acquire: 30000,
    idle:20000
  }
}