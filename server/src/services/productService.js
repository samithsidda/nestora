const products = require("../data/products.json");

function searchProducts(filters = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    color,
    material,
    adjustableHeight,
  } = filters;

  return products.filter((product) => {
    if (
      category &&
      product.category.toLowerCase() !== category.toLowerCase()
    ) {
      return false;
    }

    if (minPrice !== undefined && product.price < minPrice) {
    return false;
    }

    if (maxPrice !== undefined && product.price > maxPrice) {
    return false;
    }
    

    if (
      color &&
      product.color.toLowerCase() !== color.toLowerCase()
    ) {
      return false;
    }

    if (
      material &&
      !product.material.toLowerCase().includes(material.toLowerCase())
    ) {
      return false;
    }

    if (
      adjustableHeight !== undefined &&
      product.adjustableHeight !== adjustableHeight
    ) {
      return false;
    }

    return true;
  });
}

function getAllProducts() {
  return products;
}

module.exports = {
  searchProducts,
  getAllProducts,
};