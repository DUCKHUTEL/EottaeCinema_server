module.exports= (seq,Seq) => {
  const User = seq.define("user",{
    nickName: {
      type: Sequelize.STRING,
      primaryKey:true,
      allowNull:false
    },
    password: {
      type: Sequelize.STRING,
      allowNull:false
    },
    id: {
      type: Sequelize.STRING,
      allowNull:false,
      unique:true
    }
  })
  return User
}