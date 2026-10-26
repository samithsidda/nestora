
const {
  searchProducts,
  getAllProducts,
} = require("../services/productService");

function parsePrice(value) {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  if (
    typeof value !== "string" ||
    value.trim() === "" ||
    !/^\d+(\.\d{1,2})?$/.test(value)
  ) {
    return { valid: false };
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return { valid: false };
  }

  return { valid: true, value: number };
}

function getProducts(req, res) {
  const {
    category,
    color,
    material,
    adjustableHeight,
    minPrice: rawMinPrice,
    maxPrice: rawMaxPrice,
  } = req.query;

  const allowedCategories = [
    ...new Set(getAllProducts().map((product) => product.category)),
  ];

  if (
    category !== undefined &&
    (typeof category !== "string" ||
      !allowedCategories.includes(category.toLowerCase()))
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid category.",
      validCategories: allowedCategories,
    });
  }

  const min = parsePrice(rawMinPrice);
  const max = parsePrice(rawMaxPrice);

  if (!min.valid || !max.valid) {
    return res.status(400).json({
      success: false,
      message:
        "minPrice and maxPrice must be valid non-negative numbers with up to two decimal places.",
    });
  }

  if (
    min.value !== undefined &&
    max.value !== undefined &&
    min.value > max.value
  ) {
    return res.status(400).json({
      success: false,
      message: "minPrice cannot be greater than maxPrice.",
    });
  }

  if (
    adjustableHeight !== undefined &&
    adjustableHeight !== "true" &&
    adjustableHeight !== "false"
  ) {
    return res.status(400).json({
      success: false,
      message: 'adjustableHeight must be "true" or "false".',
    });
  }

  const filters = {
    ...(category !== undefined && {
      category: category.toLowerCase(),
    }),
    ...(color && { color }),
    ...(material && { material }),
    ...(min.value !== undefined && { minPrice: min.value }),
    ...(max.value !== undefined && { maxPrice: max.value }),
    ...(adjustableHeight !== undefined && {
      adjustableHeight: adjustableHeight === "true",
    }),
  };

  const products =
    Object.keys(filters).length === 0
      ? getAllProducts()
      : searchProducts(filters);

  return res.status(200).json({
    success: true,
    count: products.length,
    filters: {
      minPrice: min.value ?? null,
      maxPrice: max.value ?? null,
      category: category ?? null,
      color: color ?? null,
      material: material ?? null,
      adjustableHeight:
        adjustableHeight === undefined
          ? null
          : adjustableHeight === "true",
    },
    products,
  });
}

module.exports = { getProducts };
