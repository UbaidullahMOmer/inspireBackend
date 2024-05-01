const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
  const { products } = req.body;
  console.log(products);
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
        images: product?.image,
      },
      unit_amount: Math.round(product?.price * 100),
    },
    quantity: product?.qty,
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "https://inspireweb.vercel.app/success",
    cancel_url: "https://inspireweb.vercel.app/cancel",
  });
  res.json({ id: session.id });
});

app.use("/", router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
