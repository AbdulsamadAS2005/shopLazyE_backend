const mongoose = require('mongoose');

const Orders = new mongoose.Schema({
    products: [
        { productId: String, quantity: Number }
    ],
    PaymentMethod: String,
    Name: String,
    Email: String,
    PhoneNumber: String,
    Address: String,
    Status: String,
    Totalprice: String
}, { timestamps: true });


const Order=mongoose.model('Orders',Orders);
module.exports=Order;