// =======================
// server.js (Vercel-ready)
// =======================

let express = require('express');
let app = express();
require('./mongoose');
let cors = require('cors');
app.use(cors());
app.use(express.json());
require("dotenv").config();

const mongoose = require('mongoose');

// Increase body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const Admin = require('./schemas/latest.js');
const Product = require('./schemas/products.js');
const Order = require('./schemas/orders.js');

// =======================
// Basic Routes
// =======================
app.get('/', (req, res) => res.send("running!!!"));

// Latest
app.get('/getLatest', async (req, res) => {
  try {
    const latest = await Admin.find();
    res.status(latest ? 201 : 409).json(latest || { message: "Not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// New arrivals
app.get('/newArrivals', async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const newArrivals = await Product.find({ createdAt: { $gte: twoWeeksAgo } }).sort({ createdAt: -1 }).lean();
    res.status(newArrivals.length ? 200 : 404).json(newArrivals.length ? newArrivals : { message: 'No new arrivals found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Best sellers
app.get('/bestSellers', async (req, res) => {
  try {
    const bestSellers = await Product.find({ BestSeller: true }).sort({ createdAt: -1 }).lean();
    res.status(bestSellers.length ? 200 : 404).json(bestSellers.length ? bestSellers : { message: 'No best sellers found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Collections
app.get("/summerCollection", async (req, res) => {
  try {
    const products = await Product.find({ Category: "summer" }).sort({ Price: 1 });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/winterCollection", async (req, res) => {
  try {
    const products = await Product.find({ Category: "winter" }).sort({ Price: 1 });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/allProducts", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/singleProduct/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(product ? 200 : 404).json(product || { message: "Product not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// Microsoft Graph SAFE Setup
// =======================
// const { ClientSecretCredential } = require("@azure/identity");

// const tenantId = process.env.TenantId;
// const clientId = process.env.ClientId;
// const clientSecret = process.env.ClientSecret;
// const userEmail = "ceo@shoplayze.com";

// async function getCredential() {
//   try {
//     if (!tenantId || !clientId || !clientSecret) {
//       console.warn("⚠️ Azure ENV missing — skipping email");
//       return null;
//     }
//     return new ClientSecretCredential(tenantId, clientId, clientSecret);
//   } catch (err) {
//     console.error("Azure credential init failed:", err.message);
//     return null;
//   }
// }

// // =======================
// // Email sending functions (SAFE)
// // =======================
// async function sendMailToCustomerAfterConfirmOrder(id) {
//   try {
//     const credential = await getCredential();
//     if (!credential) return;

//     const token = await credential.getToken("https://graph.microsoft.com/.default");

//     const order = await Order.findById(id);
//     if (!order) return;

//     const productDetails = await Promise.all(order.products.map(async p => {
//       const prod = await Product.findById(p.productId);
//       return `${prod?.Name || "Unknown"} - Quantity: ${p.quantity}`;
//     }));

//     const mail = {
//       message: {
//         subject: "Your Order Confirmation",
//         body: {
//           contentType: "Text",
//           content: `Hello!\n\nOrder Details:\n${productDetails.join("\n")}\n\nTotal: ${order.Totalprice}\nAddress: ${order.Address}`
//         },
//         toRecipients: [{ emailAddress: { address: order.Email } }],
//       }
//     };

//     await fetch(`https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token.token}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(mail)
//     });

//     console.log("✅ Customer email sent");
//   } catch (err) {
//     console.error("Customer email failed:", err.message);
//   }
// }

// async function sendMailToOwnGmailAfterConfirmOrder(id) {
//   try {
//     const credential = await getCredential();
//     if (!credential) return;

//     const token = await credential.getToken("https://graph.microsoft.com/.default");

//     const order = await Order.findById(id);
//     if (!order) return;

//     const productDetails = await Promise.all(order.products.map(async p => {
//       const prod = await Product.findById(p.productId);
//       return `${prod?.Name || "Unknown"} - Quantity: ${p.quantity}`;
//     }));

//     const mail = {
//       message: {
//         subject: "📦 New Order Received - ShopLayze",
//         body: {
//           contentType: "Text",
//           content: `New order!\nCustomer: ${order.Name}\nEmail: ${order.Email}\nPhone: ${order.PhoneNumber}\nItems:\n${productDetails.join("\n")}\nPayment: ${order.PaymentMethod}\nTotal: ${order.Totalprice}\nAddress: ${order.Address}`
//         },
//         toRecipients: [{ emailAddress: { address: "iabdulsamad28@gmail.com" } }],
//       }
//     };

//     await fetch(`https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token.token}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(mail)
//     });

//     console.log("✅ Admin email sent");
//   } catch (err) {
//     console.error("Admin email failed:", err.message);
//   }
// }

// =======================
// Fixed /newOrder route
// =======================
app.post('/newOrder', async (req, res) => {
  try {
    const { products, PaymentMethod, Name, Email, PhoneNumber, Address, Totalprice } = req.body;

    const newOrder = new Order({
      products,
      PaymentMethod,
      Name,
      Email,
      PhoneNumber,
      Address,
      Totalprice,
      Status: "pending",
    });

    const savedOrder = await newOrder.save();

    // SAFE async background emails
    // setTimeout(() => {
    //   sendMailToCustomerAfterConfirmOrder(savedOrder._id);
    //   sendMailToOwnGmailAfterConfirmOrder(savedOrder._id);
    // }, 0);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error("/newOrder failed:", err);
    res.status(500).json({ success: false, message: "Failed to create order", error: err.message });
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
