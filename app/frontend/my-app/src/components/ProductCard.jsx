import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  DollarSign,
  Star,
  ChevronRight,
  User,
  LogIn,
  X,
  Heart,
  ChevronLeft,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import config from "../config";
import { toast } from "react-hot-toast";

// Wishlist logic (localStorage-based)
const getWishlist = () => {
  const stored = localStorage.getItem("wishlist");
  return stored ? JSON.parse(stored) : [];
};

const isInWishlist = (productId) => {
  return getWishlist().some((item) => item.product_id === productId);
};

const toggleWishlistItem = (product) => {
  const current = getWishlist();
  const exists = current.some((item) => item.product_id === product.product_id);
  let updated;

  if (exists) {
    updated = current.filter((item) => item.product_id !== product.product_id);
    toast.error(`${product.name} removed from Wishlist`);
  } else {
    const newItem = {
      product_id: product.product_id,
      user_id: product.user_id,
      name: product.name,
      price: product.price,
      username: product.username,
      condition: product.condition,
      description: product.description,
      rating: product.rating || product.seller_rating || 0,
    };
    updated = [...current, newItem];
    toast.success(`${product.name} added to Wishlist`);
  }

  localStorage.setItem("wishlist", JSON.stringify(updated));
};

const ProductCard = ({ product }) => {
  const [messaging, setMessaging] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setWishlisted(isInWishlist(product.product_id));
  }, [product.product_id]);

  const sellerRating =
    product.seller_rating !== undefined
      ? product.seller_rating
      : product.rating || 0;

  const formattedRating =
    typeof sellerRating === "number" ? sellerRating.toFixed(1) : "0.0";

  const handleMessageSeller = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login to message the seller");
      navigate("/login");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.user_id === product.user_id) {
      toast.error("You cannot message yourself about your own product");
      return;
    }

    try {
      setMessaging(true);
      if (!initialMessage) {
        setInitialMessage(
          `Hi! I'm interested in your "${product.name}". Is it still available?`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
      setMessaging(false);
    }
  };

  const sendInitialMessage = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${config.apiUrl}/messaging/conversations`,
        {
          product_id: product.product_id,
          recipient_id: product.user_id,
          subject: `About ${product.name}`,
          initial_message: initialMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Message sent! Redirecting to conversation...");
      navigate(`/messages/${response.data.conversation_id}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setMessaging(false);
    }
  };

  const viewProductDetails = () => setShowFullView(true);

  const goToSellerProfile = (e) => {
    e.stopPropagation();
    if (product.user_id) {
      navigate(`/user/${product.user_id}`);
    } else {
      toast.error("Seller information not available");
    }
  };

  const goToLogin = (e) => {
    e.stopPropagation();
    navigate("/login", {
      state: { redirectAfterLogin: window.location.pathname },
    });
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    toggleWishlistItem(product);
    setWishlisted(!wishlisted);
  
    const token = localStorage.getItem("token");
    if (!token) return;
  
    try {
      await fetch(`${config.apiUrl}/wishlist/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.product_id }),
      });
    } catch (err) {
      console.error("Error syncing wishlist to backend:", err);
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (product.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (product.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  // Helper function to get the full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/pictures/placeholder.png";
    return imagePath.startsWith("/") ? `${config.apiUrl}${imagePath}` : imagePath;
  };

  // Placeholder image fallback for error handling
  const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
        onClick={viewProductDetails}
      >
        <div className="relative h-48 bg-gray-200">
          <img
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImage;
            }}
          />
          {product.condition && (
            <div className="absolute top-2 left-2 bg-[#2E0854] text-white text-xs font-bold px-2 py-1 rounded">
              {product.condition}
            </div>
          )}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 p-1 rounded-full bg-white shadow ${
              wishlisted ? "text-red-500" : "text-gray-400"
            } hover:text-red-600 transition`}
          >
            <Heart
              className="w-5 h-5"
              fill={wishlisted ? "currentColor" : "none"}
            />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-[#2E0854] truncate mr-2">
              {product.name}
            </h3>
            <div className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs ml-1">{formattedRating}</span>
            </div>
          </div>

          <div className="flex items-center mt-1 text-lg font-bold text-[#2E0854]">
            <DollarSign className="w-5 h-5" />
            {typeof product.price === "number"
              ? product.price.toFixed(2)
              : product.price}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {product.description || "No description available"}
          </p>

          <div className="flex justify-between items-center mt-3">
            <button
              onClick={goToSellerProfile}
              className="text-xs text-gray-500 hover:text-[#2E0854] hover:underline flex items-center"
            >
              <User className="w-3 h-3 mr-1" />@{product.username || "seller"}
            </button>

            {!messaging ? (
              isLoggedIn ? (
                <button
                  onClick={handleMessageSeller}
                  className="bg-[#FFCC00] text-[#2E0854] px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-yellow-300 transition"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </button>
              ) : (
                <button
                  onClick={goToLogin}
                  className="bg-[#2E0854] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-purple-900 transition"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Login to Message
                </button>
              )
            ) : (
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-[#2E0854]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Product View Modal */}
      {showFullView && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullView(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
              <h2 className="text-2xl font-bold text-[#2E0854]">
                {product.name}
              </h2>
              <button
                onClick={() => setShowFullView(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="md:flex">
              {/* Left side - Image Gallery */}
              <div className="md:w-1/2 p-4">
                {/* Primary Image Display */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  <img
                    src={getImageUrl(product.images?.[currentImageIndex])}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                  
                  {product.images && product.images.length > 1 && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-center space-x-2 p-2">
                      <button
                        onClick={prevImage}
                        className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <span className="bg-white px-2 py-1 rounded-md text-xs">
                        {currentImageIndex + 1} / {product.images.length}
                      </span>
                      <button
                        onClick={nextImage}
                        className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {product.images.map((image, index) => (
                      <div 
                        key={index}
                        className={`aspect-square bg-gray-100 rounded cursor-pointer border-2 ${
                          currentImageIndex === index ? 'border-[#2E0854]' : 'border-transparent'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side - Details */}
              <div className="md:w-1/2 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-2xl font-bold text-[#2E0854]">
                    <DollarSign className="w-6 h-6" />
                    {typeof product.price === "number"
                      ? product.price.toFixed(2)
                      : product.price}
                  </div>
                  {product.condition && (
                    <div className="bg-[#2E0854] text-white text-sm font-bold px-3 py-1 rounded">
                      {product.condition}
                    </div>
                  )}
                </div>

                <div className="flex items-center mb-6">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="ml-1 text-lg">{formattedRating}</span>
                  <button
                    onClick={goToSellerProfile}
                    className="ml-4 text-gray-600 hover:text-[#2E0854] hover:underline flex items-center"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Sold by @{product.username || "seller"}
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {product.description || "No description available"}
                  </p>
                </div>

                <div className="flex gap-4">
                  {isLoggedIn ? (
                    <button
                      onClick={handleMessageSeller}
                      className="flex-1 bg-[#FFCC00] text-[#2E0854] px-6 py-3 rounded-lg text-lg font-medium flex items-center justify-center hover:bg-yellow-300 transition"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Seller
                    </button>
                  ) : (
                    <button
                      onClick={goToLogin}
                      className="flex-1 bg-[#2E0854] text-white px-6 py-3 rounded-lg text-lg font-medium flex items-center justify-center hover:bg-purple-900 transition"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Login to Contact
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Dialog - Only shown when user is logged in */}
      {messaging && isLoggedIn && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setMessaging(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              Message about {product.name}
            </h3>

            <div className="flex items-start mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                <img
                  src={getImageUrl(product.images?.[0])}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderImage;
                  }}
                />
              </div>
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-[#2E0854] font-bold">
                  $
                  {typeof product.price === "number"
                    ? product.price.toFixed(2)
                    : product.price}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Your message:
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full p-2 border rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[#2E0854]"
                placeholder="Write your message here..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMessaging(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={sendInitialMessage}
                className="px-4 py-2 bg-[#2E0854] text-white rounded hover:bg-purple-900"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Dialog - Shown when non-logged in user clicks on product */}
      {!isLoggedIn && messaging && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setMessaging(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create an Account</h3>

            <div className="flex items-start mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                <img
                  src={getImageUrl(product.images?.[0])}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderImage;
                  }}
                />
              </div>
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-[#2E0854] font-bold">
                  $
                  {typeof product.price === "number"
                    ? product.price.toFixed(2)
                    : product.price}
                </p>
              </div>
            </div>

            <p className="text-center mb-6">
              Create an account or log in to message the seller and purchase
              items on Gator Market.
            </p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setMessaging(false);
                  navigate("/login", {
                    state: { redirectAfterLogin: window.location.pathname },
                  });
                }}
                className="w-full py-2 bg-[#2E0854] text-white rounded-full hover:bg-purple-900 transition"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMessaging(false);
                  navigate("/register", {
                    state: { redirectAfterLogin: window.location.pathname },
                  });
                }}
                className="w-full py-2 bg-[#FFCC00] text-[#2E0854] rounded-full hover:bg-yellow-300 transition"
              >
                Create Account
              </button>
              <button
                onClick={() => setMessaging(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;