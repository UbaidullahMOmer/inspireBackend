const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { db } = require("./firebase/firebase");
const stripe = require("stripe")(
  "sk_test_51P7GGR2KcbZATXLfrprjkc3qd2J2oA9GuARxoXZDimvqqZCFQLeWfacRqpJRQwj6MgFrjVFLKjzycH5BsarpVvio00hVUMNzm3"
);
const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const router = express.Router();
router.post("/create-checkout-session", async (req, res) => {
  const data = req.body;
  if (!data?.products || !Array.isArray(data?.products)) {
    return res
      .status(400)
      .json({ error: "Products data is missing or invalid" });
  }
  const lineItems = data?.products.map((product) => ({
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
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "https://inspireweb.vercel.app/success",
    cancel_url: "https://inspireweb.vercel.app/cancel",
  });
  res.json({ id: session.id });
});
const handleSubmit = async (data) => {
  try {
    const orderRef = collection(db, "orders");
    await addDoc(orderRef, data);
  } catch (error) {
    console.error("Error adding order to database:", error);
  }
};
app.post("/webhook", async (req, res) => {
  const payload = req.body;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      req.headers["stripe-signature"],
      secret
    );
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await handleSubmit({
        orderId: paymentIntent.id,
        products: req.body.data?.products,
      });
      res.sendStatus(200);
    } else {
      console.log(`Unhandled webhook event: ${event.type}`);
      res.sendStatus(200);
    }
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(400);
  }
});
app.use("/", router);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
