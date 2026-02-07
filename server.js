let express = require('express')
let app = express();
require('./mongoose')
let cors = require('cors')
app.use(cors())
app.use(express.json())
require("dotenv").config();

const mongoose = require('mongoose');

// Increase body size limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



const Admin = require('./schemas/latest.js')
const Product = require('./schemas/products.js')
const Order = require('./schemas/orders.js')

app.get('/', (req, res) => {
  res.send("running!!!")
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

app.get('/bestSellers', async (req, res) => {
  try {
    let BestSellers = await Product.find({
      BestSeller: true
    }).sort({ createdAt: -1 })
      .lean();
    if (!BestSellers.length) {
      return res.status(404).json({ message: 'No new arrivals found' });
    }
    return res.status(200).json(BestSellers);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({
      message: 'Error fetching best sellers',
    });
  }
})

app.get("/summerCollection", async (req, res) => {
  try {
    const products = await Product.find({ Category: "summer" }).sort({ Price: 1 });
    res.status(200).json(products);

  } catch (error) {
    console.error("Error fetching summer collection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/winterCollection", async (req, res) => {
  try {
    const products = await Product.find({ Category: "winter" }).sort({ Price: 1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching winter collection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/allProducts", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/singleProduct/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/newOrder', async (req, res) => {
  try {
    const { products, PaymentMethod, Name, Email, PhoneNumber, Address, Totalprice } = req.body;
    console.log("new order=> ", products, PaymentMethod, Name, Email, PhoneNumber, Address, Totalprice);

    // Create new order
    const newOrder = new Order({
      products,
      PaymentMethod,
      Name,
      Email,
      PhoneNumber,
      Address,
      Totalprice,
      Status: "pending" // optional default status
    });
    console.log("new order::=> ", newOrder);
    // Save to MongoDB
    const savedOrder = await newOrder.save();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder
    });

  } catch (error) {
    console.log(error);

  }
});

app.get('/adminHomePage', async (req, res) => {
  try {
    const allProducts = await Product.find();

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const newArrivals = await Product.find({
      createdAt: { $gte: twoWeeksAgo },
    });

    const bestSellers = await Product.find({
      BestSeller: true,
    });

    const orders = await Order.find({
      Status: "pending",
    });

    res.status(200).json({
      totalProducts: allProducts.length,
      newArrivals: newArrivals.length,
      bestSellers: bestSellers.length,
      pendingOrders: orders.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/admin/products', async (req, res) => {
  try {
    let products = await Product.find();
    res.status(201).json(products);

  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error });

  }
})

app.delete('/admin/delete-products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    await Product.findByIdAndDelete(productId);

    return res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Delete failed' });
  }
});

const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxdf5zzn8',           // Your Cloud name
  api_key: process.env.CLOUDINARY_API_KEY || '417211384441587',        // Your API Key
  api_secret: process.env.CLOUDINARY_API_SECRET || '-0xpfP2pKklhm6CFvaFYHGlrwAE', // Your API Secret
});

const streamifier = require('streamifier');

app.post('/admin/add-product', upload.single('Image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const streamUpload = (reqFile) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'products', use_filename: true, unique_filename: false },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(reqFile.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file);
    const imageUrl = result.secure_url;

    const newProduct = new Product({
      Name: req.body.Name,
      Category: req.body.Category,
      SubCategory: req.body.SubCategory,
      BestSeller: req.body.BestSeller === 'true',
      ImageUrl: imageUrl,
      Price: req.body.Price,
      DiscountedPrice: req.body.DiscountedPrice || req.body.Price
    });

    await newProduct.save();

    res.status(200).json({ success: true, message: 'Product added successfully!', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});


// Order Management Routes

// Get all orders
// Get all orders with populated product details
// Get all orders with populated product details
// Get all orders with populated product details
// Get all orders with populated product details
// Get all orders with populated product details
// Get all orders with populated product details
app.get('/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    console.log('\n=== DEBUG: Fetching Orders ===');
    console.log(`Total orders found: ${orders.length}`);

    // Fetch product details for all product IDs in all orders
    const ordersWithProductDetails = await Promise.all(
      orders.map(async (order, orderIndex) => {
        console.log(`\n--- Processing Order ${orderIndex + 1} ---`);
        console.log(`Order ID: ${order._id}`);
        console.log(`Customer: ${order.Name}`);
        console.log(`Total Price: ${order.Totalprice}`);

        const orderObj = order.toObject();

        if (orderObj.products && orderObj.products.length > 0) {
          console.log(`Products in order: ${orderObj.products.length}`);

          // For each product in the order, fetch its details
          const productsWithDetails = await Promise.all(
            orderObj.products.map(async (item, productIndex) => {
              console.log(`\n  Product ${productIndex + 1}:`);
              console.log(`    Quantity: ${item.quantity}`);

              // Check for product ID - it might be in _id or productID field
              const productId = item.productId;
              console.log(`    Looking for product with ID: "${productId}"`);

              try {
                if (productId) {
                  // Check if it's a valid ObjectId
                  if (!mongoose.Types.ObjectId.isValid(productId)) {
                    console.log(`    ERROR: Invalid ObjectId format: "${productId}"`);
                  } else {
                    const product = await Product.findById(productId);

                    if (product) {
                      console.log(`    ✅ Found product: "${product.Name}"`);
                      console.log(`    Price: ${product.Price}`);
                      console.log(`    Image URL: ${product.ImageUrl ? 'Yes' : 'No'}`);
                      return {
                        Name: product.Name || 'Product',
                        ImageUrl: product.ImageUrl || 'https://via.placeholder.com/150',
                        Price: product.Price || '0',
                        DiscountedPrice: product.DiscountedPrice || product.Price,
                        quantity: item.quantity || 1,
                        _id: productId
                      };
                    } else {
                      console.log(`    ❌ Product not found in database`);

                      // Let's check if any products exist at all
                      const totalProducts = await Product.countDocuments();
                      console.log(`    Total products in database: ${totalProducts}`);

                      // Get first few products to see their IDs
                      const sampleProducts = await Product.find().limit(3);
                      console.log(`    Sample product IDs: ${sampleProducts.map(p => p._id.toString())}`);
                    }
                  }
                } else {
                  console.log(`    ❌ No product ID provided`);
                }
              } catch (error) {
                console.error(`    ❌ Error fetching product:`, error.message);
              }

              // Return default values if product not found
              console.log(`    ⚠️ Returning "Product Not Found"`);
              return {
                Name: 'Product Not Found',
                ImageUrl: 'https://via.placeholder.com/150',
                Price: '0',
                DiscountedPrice: '0',
                quantity: item.quantity || 1,
                _id: productId || 'unknown'
              };
            })
          );

          orderObj.products = productsWithDetails;
        } else {
          console.log('No products in this order');
        }

        return orderObj;
      })
    );

    console.log('\n=== DEBUG: Sending Response ===');
    res.status(200).json(ordersWithProductDetails);
  } catch (error) {
    console.error('\n=== ERROR: Fetching orders ===', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});


app.put('/admin/update-order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    console.log(orderId, status);



    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { Status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Get orders by status with populated product details
// Get orders by status with populated product details
app.get('/admin/orders/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ Status: status }).sort({ createdAt: -1 });

    // Populate product details for each order
    const ordersWithProductDetails = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toObject();

        if (orderObj.products && orderObj.products.length > 0) {
          const productsWithDetails = await Promise.all(
            orderObj.products.map(async (item) => {
              try {
                // Check for product ID - it might be in _id or productID field
                const productId = item.productId;

                const product = await Product.findById(productId);

                if (product) {
                  return {
                    Name: product.Name || 'Product',
                    ImageUrl: product.ImageUrl || 'https://via.placeholder.com/150',
                    Price: product.Price || '0',
                    DiscountedPrice: product.DiscountedPrice || product.Price,
                    quantity: item.quantity || 1,
                    _id: productId
                  };
                }
              } catch (error) {
                console.error('Error fetching product:', error);
              }

              return {
                Name: 'Product Not Found',
                ImageUrl: 'https://via.placeholder.com/150',
                Price: '0',
                quantity: item.quantity || 1,
                _id: item.productId || 'unknown'
              };
            })
          );

          orderObj.products = productsWithDetails;
        }

        return orderObj;
      })
    );

    res.status(200).json(ordersWithProductDetails);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});


module.exports = app;
