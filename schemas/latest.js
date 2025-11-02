const mongoose=require('mongoose')
const Admins = new mongoose.Schema({
  Latest:String,
  CollectionToShowOnHome:String
});

const Admin = mongoose.model("Admins", Admins);
module.exports=Admin;