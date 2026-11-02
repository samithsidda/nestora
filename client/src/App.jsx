
import ProductList from "./components/ProductList";
import RecommendationForm from "./components/RecommendationForm";
import "./App.css";

function App() {
  return (
    <div className="page-wrapper">
      <header className="app-header">
        <div className="header-container">
          <div className="brand-group">
            <span className="brand-badge">HOME LIVING</span>
            <h1 className="brand-title">Nestora</h1>
          </div>
          <p className="brand-tagline">
            Discover furniture that fits your space, style, and budget.
          </p>
        </div>
      </header>

      <main className="app">
        <RecommendationForm />

        <div className="section-divider" role="separator">
          <span className="divider-label">EXPLORE COMPLETE COLLECTION</span>
        </div>

        <ProductList />
      </main>

      <footer className="app-footer">
        <p>© 2026 Nestora. Verified catalogue search & grounded recommendations.</p>
      </footer>
    </div>
  );
}

export default App;
