let express = require('express')
let app = express();
require('./mongoose')
let cors = require('cors')
app.use(cors())

const Admin = require('./schemas/latest.js')
const Product = require('./schemas/products.js')

app.get('/', (req, res) => {
    res.send("running")
})

app.get('/getLatest', async (req, res) => {
    const latest = await Admin.find();
    if (latest) {
        res.status(201).json(latest)
    }
    else {
        res.status(409).json({ message: "Not found" })
    }
})

app.get('/newArrivals', async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const newArrivals = await Product.find({
      createdAt: { $gte: twoWeeksAgo },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!newArrivals.length) {
      return res.status(404).json({ message: 'No new arrivals found' });
    }

    return res.status(200).json(newArrivals);
  } catch (err) {
    console.error('Error fetching new arrivals:', err);
    res.status(500).json({
      message: 'Error fetching new arrivals',
    });
  }
});




app.listen(5000, () => {
    console.log("server is running");

})

module.exports = app;