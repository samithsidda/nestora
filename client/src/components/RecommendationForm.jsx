
import { useState } from "react";
import { getRecommendations } from "../services/recommendationApi";

function RecommendationForm() {
  const [userRequest, setUserRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!userRequest.trim()) {
      setError("Please describe the furniture you are looking for.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await getRecommendations(userRequest.trim());
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to generate recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="recommendation-section">
      <h2>Ask Nestora AI</h2>
      <p>
        Describe what you need, and AI will find matching furniture
        from our catalogue.
      </p>

      <form onSubmit={handleSubmit} className="recommendation-form">
        <label htmlFor="userRequest">
          What furniture are you looking for?
        </label>

        <textarea
          id="userRequest"
          value={userRequest}
          onChange={(event) => setUserRequest(event.target.value)}
          placeholder="e.g. Recommend an adjustable black desk under 8000 rupees."
          rows={4}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Finding furniture..." : "Get recommendations"}
        </button>
      </form>

      {error && <p role="alert" className="error-message">{error}</p>}

      {result && (
        <div className="recommendation-results">
          <h3>Recommendations</h3>
          <p>{result.message}</p>

          {result.recommendations.length === 0 ? (
            <p>No matching furniture found. Try a different request.</p>
          ) : (
            <div className="product-grid">
                
                {result.recommendations.map((product) => (
                <article className="product-card recommendation-card" key={product.productId}>
                    <div className="product-image-wrap">
                    <img
                        className="product-image"
                        src={`/products/${product.productId}.png`}
                        alt={product.name}
                        loading="lazy"
                    />
                    <span className="ai-match-label">AI PICK</span>
                    </div>

                    <div className="product-details">
                    <h3 title={product.name}>{product.name}</h3>

                    <p className="product-price">
                        {product.currency === "INR" ? "₹" : `${product.currency} `}
                        {product.price.toLocaleString("en-IN")}
                    </p>

                    <div className="recommendation-reason">
                        <span className="reason-heading">Why this matches</span>
                        <p>{product.reason}</p>
                    </div>
                    </div>
                </article>
                ))}

            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default RecommendationForm;
