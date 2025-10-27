const mongoose=require('mongoose')

const Products=new mongoose.Schema({
    Name:String,
    Category:String,
    SubCategory:String,
    BestSeller:Boolean,
    ImageUrl:String,
    Price:String,
    DiscountedPrice:String
},{timestamps:true})

const Product=mongoose.model('Products',Products)
module.exports=Product;