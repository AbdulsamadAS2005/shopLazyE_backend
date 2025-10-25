let express=require('express')
let app=express();
require('./mongoose')
let mongoose=require('mongoose')
let cors=require('cors')
app.use(cors())

const Admins = new mongoose.Schema({
  Latest:String
});

const Admin = mongoose.model("Admins", Admins);

app.get('/',(req,res)=>{
    res.send("running")
})

app.get('/getLatest',async(req,res)=>{
    const latest=await Admin.find();
    if(latest){
        res.status(201).json(latest)
    }
    else{
        res.status(409).json({message:"Not found"})
    }
})

app.listen(5000,()=>{
    console.log("server is running");
    
})