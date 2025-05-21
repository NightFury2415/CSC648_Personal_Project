import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import config from "../config";
import { Package, PlusCircle, Settings } from "lucide-react";
import { toast } from "react-hot-toast";

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [listedItems, setListedItems] = useState([]);
  const [trackedItems, setTrackedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("listed");
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      toast.error("Please login to view your profile");
      navigate("/login");
      return;
    }
    fetchUserProfile();
    fetchUserListings();
    loadTrackedItems();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${config.apiUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch {
      toast.error("Error loading profile");
      navigate("/login");
    }
  };

  const fetchUserListings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.get(
        `${config.apiUrl}/products/search?user_id=${user.user_id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setListedItems(response.data || []);
    } catch {
      toast.error("Failed to load your listings.");
    }
  };

  const loadTrackedItems = () => {
    const saved = JSON.parse(localStorage.getItem("trackedItems")) || [];
    setTrackedItems(saved);
  };

  const removeTrackedItem = (id) => {
    const updated = trackedItems.filter((item) => item.id !== id);
    setTrackedItems(updated);
    localStorage.setItem("trackedItems", JSON.stringify(updated));
    toast.success("Removed from tracked items.");
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profile_picture_url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async () => {
    try {
      const isBase64 =
        profile.profile_picture_url &&
        profile.profile_picture_url.startsWith("data:");

      await axios.put(
        `${config.apiUrl}/auth/update-profile`,
        {
          username: profile.username,
          profile_picture_url: isBase64 ? null : profile.profile_picture_url,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user")),
        username: profile.username,
        ...(isBase64
          ? {}
          : { profile_picture_url: profile.profile_picture_url }),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Profile updated!");
      setShowEditModal(false);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center mt-12 text-gray-600">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img
              src={profile.profile_picture_url || "/default-profile.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-[#FFCC00] object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {profile.first_name || ""} {profile.last_name || ""}
              </h1>
              <p className="text-gray-600 mb-1">@{profile.username}</p>
              <p className="text-gray-600 mb-1">Email: {profile.email}</p>
              <p className="text-gray-600 mb-2">
                Member since:{" "}
                {new Date(profile.date_joined).toLocaleDateString()}
              </p>

              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-[#2E0854]">
                  {(profile.rating || 0).toFixed(1)}
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill={
                        (profile.rating || 0) >= i + 1 ? "#FFD700" : "#E5E7EB"
                      }
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674h4.912c.969 
                      0 1.371 1.24.588 1.81l-3.975 2.89 1.518 4.674c.3.921-.755 1.688-1.54 
                      1.118L10 15.347l-3.975 2.89c-.784.57-1.838-.197-1.539-1.118l1.518-4.674-3.975-
                      2.89c-.783-.57-.38-1.81.588-1.81h4.912l1.518-4.674z"
                      />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-[#FFCC00] text-[#2E0854] px-4 py-2 rounded-full 
                  font-semibold hover:bg-yellow-300 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            onClick={() => navigate("/")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center cursor-pointer"
          >
            <Package className="w-10 h-10 text-[#2E0854] mb-3" />
            <h3 className="text-lg font-semibold mb-1">Browse Marketplace</h3>
            <p className="text-gray-600">Find items to buy</p>
          </div>
          <div
            onClick={() => navigate("/upload")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center cursor-pointer"
          >
            <PlusCircle className="w-10 h-10 text-[#2E0854] mb-3" />
            <h3 className="text-lg font-semibold mb-1">List New Item</h3>
            <p className="text-gray-600">Sell something on Gator Market</p>
          </div>
          <div
            onClick={() => navigate("/messages")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center cursor-pointer"
          >
            <Settings className="w-10 h-10 text-[#2E0854] mb-3" />
            <h3 className="text-lg font-semibold mb-1">Messages</h3>
            <p className="text-gray-600">Check your conversations</p>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "listed"
                ? "text-[#2E0854] border-b-2 border-[#2E0854]"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("listed")}
          >
            My Listings
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "tracked"
                ? "text-[#2E0854] border-b-2 border-[#2E0854]"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("tracked")}
          >
            Tracked Items
          </button>
        </div>

        {activeTab === "listed" ? (
          listedItems.length === 0 ? (
            <p className="text-center text-gray-500">No listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listedItems.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <img
                    src={
                      item.images && item.images.length > 0
                        ? item.images[0].startsWith("/")
                          ? `${config.apiUrl}${item.images[0]}`
                          : item.images[0]
                        : "/pictures/placeholder.png"
                    }
                    alt={item.name}
                    className="h-40 w-full object-contain mb-4 rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/pictures/placeholder.png";
                    }}
                  />
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-700">${item.price}</p>

                  {item.status === "sold" && (
                    <span className="text-sm text-red-600 font-semibold">SOLD</span>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        navigate(`/edit-product/${item.product_id}`)
                      }
                      className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this listing?"
                          )
                        ) {
                          try {
                            await axios.delete(
                              `${config.apiUrl}/products/${item.product_id}`,
                              {
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem(
                                    "token"
                                  )}`,
                                },
                              }
                            );
                            toast.success("Item deleted");
                            fetchUserListings();
                          } catch {
                            toast.error("Failed to delete item.");
                          }
                        }
                      }}
                      className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : trackedItems.length === 0 ? (
          <p className="text-center text-gray-500">No tracked items yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4">
                <img
                  src={item.images?.[0] || "https://via.placeholder.com/300x200"}
                  className="h-40 w-full object-contain mb-4 rounded"
                />
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-700">${item.price}</p>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="bg-[#2E0854] text-white px-3 py-1 rounded text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => removeTrackedItem(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-gray-200 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-[#2E0854]">
                Edit Profile
              </h2>

              <label className="block mb-2 text-sm font-medium">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              />

              <label className="block mb-2 text-sm font-medium">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="mb-4"
              />

              {profile.profile_picture_url && (
                <div className="flex justify-center mb-4">
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile Preview"
                    className="w-24 h-24 object-cover rounded-full border-2 border-gray-300"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="text-sm px-4 py-2 bg-[#2E0854] text-white hover:bg-purple-900 rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
