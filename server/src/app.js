
const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json({ limit: "10kb" }));


app.use("/api/products", productRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Nestora API is running",
  });
});

module.exports = app;
