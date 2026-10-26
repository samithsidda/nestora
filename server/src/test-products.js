const {
  searchProducts,
  getAllProducts,
} = require("./services/productService");

console.log("Total products:", getAllProducts().length);

console.log(
  "Black desks under ₹8,000:",
  searchProducts({
    category: "desk",
    maxPrice: 8000,
    color: "black",
  }).map((product) => product.name)
);

console.log(
  "Adjustable desks:",
  searchProducts({
    category: "desk",
    adjustableHeight: true,
  }).map((product) => product.name)
);

console.log(
  "Non-adjustable desks:",
  searchProducts({
    category: "desk",
    adjustableHeight: false,
  }).map((product) => product.name)
);