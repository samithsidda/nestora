
import ProductList from "./components/ProductList";
import RecommendationForm from "./components/RecommendationForm";
import "./App.css";

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>Nestora </h1>
        <p>
          Discover furniture that fits your space, style, and budget.
        </p>
      </header>

      <RecommendationForm />

      <hr />

      <ProductList />
    </main>
  );
}

export default App;
