const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const stripe = require("stripe")("YOUR_STRIPE_TEST_SECRET_KEY"); // Replace with your actual Stripe test secret key

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
  const { products } = req.body;

  // Validate products data
  if (!products || !Array.isArray(products)) {
    return res
      .status(400)
      .json({ error: "Products data is missing or invalid" });
  }

  // Create line items with optional fields
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

  // Collect customer information (address and phone number)
  const { shippingAddress, phoneNumber } = req.body;

  // Optional validation (consider using a validation library)
  if (!shippingAddress || !phoneNumber) {
    return res.status(400).json({ error: "Shipping address and phone number are required." });
  }

  // You can add more specific validation checks here (e.g., address format, phone number length)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    // Billing information configuration
    customer_email: shippingAddress?.email, // Use email from address if available
    billing_address: shippingAddress, // Pass the entire shipping address object
    shipping_address_collection: {
      allowed_countries: ["PK"], // Allow addresses from Pakistan
    },
    // ... other session options (success_url, cancel_url, etc.)
    success_url: "https://your-success-url.com", // Replace with your success page URL
    cancel_url: "https://your-cancel-url.com", // Replace with your cancel page URL
  });

  res.json({ id: session.id });
});

app.use("/", router);

// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong."); // Provide a more user-friendly error message if possible
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
