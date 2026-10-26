
import { useState } from "react";

function ProductFilters({ onSearch }) {
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [color, setColor] = useState("");
  const [adjustableHeight, setAdjustableHeight] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const filters = {
      ...(category && { category }),
      ...(minPrice !== "" && { minPrice }),
      ...(maxPrice !== "" && { maxPrice }),
      ...(color.trim() && { color: color.trim() }),
      ...(adjustableHeight !== "" && {
        adjustableHeight,
      }),
    };

    onSearch(filters);
  }

  function handleReset() {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setColor("");
    setAdjustableHeight("");
    onSearch({});
  }

  return (
    <form onSubmit={handleSubmit} className="filter-form">
      <h2>Find your furniture</h2>

      <label htmlFor="category">Category</label>
      <select
        id="category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
        <option value="">All categories</option>
        <option value="desk">Desk</option>
        <option value="chair">Chair</option>
        <option value="shelf">Shelf</option>
      </select>

      <label htmlFor="minPrice">Minimum price (₹)</label>
      <input
        id="minPrice"
        type="number"
        min="0"
        step="0.01"
        value={minPrice}
        onChange={(event) => setMinPrice(event.target.value)}
        placeholder="e.g. 3000"
      />

      <label htmlFor="maxPrice">Maximum price (₹)</label>
      <input
        id="maxPrice"
        type="number"
        min="0"
        step="0.01"
        value={maxPrice}
        onChange={(event) => setMaxPrice(event.target.value)}
        placeholder="e.g. 10000"
      />

      <label htmlFor="color">Color</label>
      <input
        id="color"
        type="text"
        value={color}
        onChange={(event) => setColor(event.target.value)}
        placeholder="e.g. black"
      />

      <label htmlFor="adjustableHeight">
        Height adjustability
      </label>
      <select
        id="adjustableHeight"
        value={adjustableHeight}
        onChange={(event) =>
          setAdjustableHeight(event.target.value)
        }
      >
        <option value="">Any</option>
        <option value="true">Adjustable</option>
        <option value="false">Not adjustable</option>
      </select>

      <div className="filter-actions">
        <button type="submit">Apply filters</button>
        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  );
}

export default ProductFilters;
