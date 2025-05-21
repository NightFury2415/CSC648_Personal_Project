import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { X } from "lucide-react";
import config from "../config";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.apiUrl}/wishlist/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setWishlistItems(data);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      }
    };

    const fetchArchived = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.apiUrl}/wishlist/archived`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setArchivedItems(data);
      } catch (err) {
        console.error("Error fetching archived items:", err);
      }
    };

    fetchWishlist();
    fetchArchived();
  }, []);

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) =>
      prev.filter((item) => item.product_id !== productId)
    );
  };

  const archiveItem = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${config.apiUrl}/wishlist/archive/${productId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistItems((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
    } catch (err) {
      console.error("Failed to archive item:", err);
    }
  };

  const displayedItems = showArchived ? archivedItems : wishlistItems;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-center mb-8">My Wishlist</h1>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 rounded-l ${!showArchived ? 'bg-purple-800 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Active Items
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 rounded-r ${showArchived ? 'bg-purple-800 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Archived Items
          </button>
        </div>

        {displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <div
              key={item.product_id}
              className="bg-white p-4 rounded-lg shadow mb-4 flex items-center gap-4"
            >
              <img
                src={
                  item.image_url
                    ? item.image_url.startsWith("/")
                      ? `${config.apiUrl}${item.image_url}`
                      : item.image_url
                    : "/pictures/placeholder.png"
                }
                alt={item.name}
                className="h-40 w-full object-contain mb-4 rounded"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/pictures/placeholder.png";
                }}
              />

              <div className="flex-grow">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-gray-700 font-medium">${item.price}</p>
                <p className="text-sm text-gray-500">
                  Uploaded by: {item.username || "Unknown"}
                </p>
              </div>

              {!showArchived && (
                <div className="flex flex-col items-end">
                  <button
                    onClick={() => removeFromWishlist(item.product_id)}
                    className="text-red-500 hover:text-red-700 transition mb-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {item.status === "sold" && (
                    <button
                      onClick={() => archiveItem(item.product_id)}
                      className="text-gray-600 text-sm hover:underline"
                    >
                      Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">
            {showArchived ? "No archived items." : "Your wishlist is empty."}
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;