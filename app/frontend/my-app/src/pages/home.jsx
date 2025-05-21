import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { Search, Package, Plus } from "lucide-react";
import config from "../config";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [sortOption, setSortOption] = useState("Newest"); // ✅ NEW

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    setCategories([
      { category_id: 1, name: "Computers" },
      { category_id: 2, name: "Phones/Tablets" },
      { category_id: 3, name: "Tech Accessories" },
      { category_id: 4, name: "Books" },
      { category_id: 5, name: "Clothes/Furniture" },
    ]);

    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchProducts(selectedCategory, searchTerm);
    }, 100);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm, selectedCategory]);

  const buildQueryString = (category = selectedCategory, term = searchTerm) => {
    let query = "";
    if (term.trim() !== "") {
      query += `term=${encodeURIComponent(term.trim())}`;
    }
    if (category !== "All Categories") {
      if (query !== "") query += "&";
      query += `category=${encodeURIComponent(category)}`;
    }
    return query;
  };

  const fetchProducts = async (
    category = selectedCategory,
    term = searchTerm
  ) => {
    setLoading(true);
    try {
      const query = buildQueryString(category, term);
      const url = `${config.apiUrl}/products/search${query ? `?${query}` : ""}`;
      const response = await axios.get(url);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && !searchHistory.includes(searchTerm.trim())) {
      const updatedHistory = [searchTerm.trim(), ...searchHistory].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    }
    setShowHistory(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // ✅ NEW: sorting logic
  const sortedProducts = [...products].sort((a, b) => {
    if (sortOption === "A-Z") return a.name.localeCompare(b.name);
    if (sortOption === "Z-A") return b.name.localeCompare(a.name);
    if (sortOption === "Low to High") return a.price - b.price;
    if (sortOption === "High to Low") return b.price - a.price;
    if (sortOption === "Oldest")
      return new Date(a.created_at) - new Date(b.created_at);
    return new Date(b.created_at) - new Date(a.created_at); // Default: Newest
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-[#2E0854] text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to Gator Market
          </h1>
          <p className="mb-8 max-w-xl mx-auto">
            The marketplace for SFSU students. Buy and sell textbooks,
            electronics, and more with your fellow Gators.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-grow flex">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 150)}
                  placeholder="Search for items..."
                  className="pl-10 pr-4 py-2 w-full rounded-l text-black"
                  style={{ backgroundColor: "white" }}
                />
                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && (
                  <div className="absolute mt-2 w-full bg-white border border-gray-300 rounded shadow z-10 text-left">
                    {searchHistory.map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                        onClick={() => {
                          setSearchTerm(item);
                          setShowHistory(false);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                    <div
                      className="px-4 py-2 text-sm text-blue-600 hover:underline cursor-pointer"
                      onClick={clearSearchHistory}
                    >
                      Clear search history
                    </div>
                  </div>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border-l px-4 py-2 bg-white text-gray-700 font-medium rounded-r"
              >
                <option>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-[#FFCC00] text-[#2E0854] px-6 py-2 rounded font-medium hover:bg-yellow-400"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h2 className="text-2xl font-bold mb-6 text-[#2E0854]">
          {selectedCategory === "All Categories"
            ? "Latest Listings"
            : selectedCategory}
        </h2>

        {/* ✅ Sort Dropdown */}
        <div className="flex justify-end mb-4">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border px-3 py-2 rounded bg-white text-sm shadow-sm"
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="A-Z">A - Z</option>
            <option value="Z-A">Z - A</option>
            <option value="Low to High">Price: Low to High</option>
            <option value="High to Low">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2E0854]"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No products found.</p>
            {user && (
              <Link
                to="/upload"
                className="inline-flex items-center bg-[#2E0854] text-white px-4 py-2 rounded hover:bg-purple-900 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                List Something
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
