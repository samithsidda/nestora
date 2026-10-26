
import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../services/productApi";
import ProductFilters from "./ProductFilters";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [wishlist, setWishlist] = useState([]);

  const fetchProducts = useCallback(async (activeFilters) => {
    setLoading(true);
    setError("");

    try {
      const data = await getProducts(activeFilters);
      setProducts(data.products);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [fetchProducts, filters]);

  function toggleWishlist(productId) {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  return (
    <section className="catalogue-section">
      <ProductFilters onSearch={setFilters} />

      {loading && <p>Loading furniture...</p>}
      {!loading && error && <p role="alert">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p>No furniture products match your filters.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="catalogue-heading">
            <div>
              <p className="eyebrow">CURATED FOR YOUR SPACE</p>
              <h2>Explore Furniture</h2>
            </div>
            <span>{products.length} products</span>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img
                    className="product-image"
                    src={product.image || `/products/${product.id}.png`}
                    alt={product.name}
                    loading="lazy"
                  />

                  <button
                    type="button"
                    className={`wishlist-button ${
                      wishlist.includes(product.id) ? "is-active" : ""
                    }`}
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={
                      wishlist.includes(product.id)
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={wishlist.includes(product.id)}
                  >
                    {wishlist.includes(product.id) ? "♥" : "♡"}
                  </button>
                </div>

                <div className="product-details">
                <h3 title={product.name}>{product.name}</h3>

                <div className="product-rating" aria-label="Catalogue item">
                    <span className="product-category">
                    {product.category}
                    </span>
                    <span className="product-color">{product.color}</span>
                </div>

                <p className="product-price">
                    {product.currency === "INR" ? "₹" : `${product.currency} `}
                    {product.price.toLocaleString("en-IN")}
                </p>

                <p className="product-material">{product.material}</p>
                </div>

              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default ProductList;
