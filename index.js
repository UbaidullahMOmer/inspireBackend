const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const stripe = require("stripe")("YOUR_STRIPE_TEST_SECRET_KEY");
const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())
const router = express.Router();
router.post("/create-checkout-session", async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) {
    return res
      .status(400)
      .json({ error: "Products data is missing or invalid" });
  }
  const lineItems = products.map((product) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product?.name,
      },
      unit_amount: Math.round(product?.price * 100),
    },
    quantity: product?.qty,
  }));
  const { shippingAddress, phoneNumber } = req.body;
  if (!shippingAddress || !phoneNumber) {
    return res.status(400).json({ error: "Shipping address and phone number are required." });
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    lineItems,
    customer_email: shippingAddress?.email,
    billing_address: shippingAddress,
    shipping_address_collection: {
      allowed_countries: ["PK"],
    },
    success_url: "https://your-success-url.com",
    cancel_url: "https://your-cancel-url.com",
  });

  res.json({ id: session.id });
});
app.use("/", router);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong.");
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
