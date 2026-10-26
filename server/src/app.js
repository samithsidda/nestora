
const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
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
