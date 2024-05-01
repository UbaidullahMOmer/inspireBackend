const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { db } = require("./firebase/firebase");
const { collection, addDoc } = require("firebase/firestore");
const stripe = require("stripe")(
  "sk_test_51P7GGR2KcbZATXLfrprjkc3qd2J2oA9GuARxoXZDimvqqZCFQLeWfacRqpJRQwj6MgFrjVFLKjzycH5BsarpVvio00hVUMNzm3"
);

const app = express();
const port = 8000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Checkout Route
const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  const data = req.body;
  if (!data?.productsData || !Array.isArray(data.productsData)) {
    return res
      .status(400)
      .json({ error: "Products data is missing or invalid" });
  }
  const lineItems = data.productsData.map((product) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product?.name,
        images: [product?.image],
      },
      unit_amount: Math.round(product?.price * 100),
    },
    quantity: product?.qty,
  }));
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:3001/success",
      cancel_url: "https://inspireweb.vercel.app/cancel",
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Handle order submission
const handleSubmit = async (data) => {
  try {
    const orderRef = collection(db, "orders");
    await addDoc(orderRef, data);
    console.log("Order submitted successfully:", data);
  } catch (error) {
    console.error("Error submitting order:", error);
    throw new Error("Failed to submit order");
  }
};

// Payment success route
app.post("/success", async (req, res) => {
  const orderData = req.body;
  try {
    await handleSubmit(orderData);
    res.status(200).send("Order submitted successfully");
  } catch (error) {
    res.status(500).send("Failed to submit order");
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
