import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  MessageCircle,
  PlusCircle,
  Heart,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import config from "../config";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
  
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
      fetchUnreadCount();
  
      const fetchNotifications = async () => {
        console.log("⏱️ Checking for wishlist notifications...");
        try {
          const res = await fetch(`${config.apiUrl}/wishlist/notifications`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          console.log("📬 Response data:", data);
          if (Array.isArray(data) && data.length > 0) {
            console.log("✅ Notification(s) found:", data);
            data.forEach((item) => {
              toast(`"${item.name}" from your wishlist has been sold!`, {
                icon: "⚠️",
                duration: 6000,
                style: {
                  borderRadius: "8px",
                  background: "#fff8e1",
                  color: "#2E0854",
                  border: "1px solid #FFCC00",
                },
              });
            });
          }
        } catch (err) {
          console.error("Error fetching wishlist notifications:", err);
        }
      };
  
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchNotifications();
      }, 30000); // every 30 seconds
  
      return () => clearInterval(interval);
    }
  }, []);
  

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${config.apiUrl}/messaging/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    fetch(`${config.apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("wishlist");
        setIsLoggedIn(false);
        setUser(null);
        toast.success("Successfully logged out!");
        navigate("/");
        setTimeout(() => {
          window.location.reload();
        }, 100);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("wishlist");
        setIsLoggedIn(false);
        setUser(null);
        navigate("/");
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });
  };

  const initial = user?.username?.charAt(0).toUpperCase() || "";

  return (
    <div className="w-full flex justify-between items-center px-6 sm:px-12 py-4 bg-[#2E0854] shadow-md relative">
      <Link to="/">
        <h1 className="text-[#FFCC00] text-3xl font-bold">Gator Market</h1>
      </Link>

      {/* Desktop menu */}
      <div className="hidden sm:flex gap-4 items-center">
        <Link to="/about" className="text-white font-medium hover:underline">
          About
        </Link>
        <Link to="/contact" className="text-white font-medium hover:underline">
          Contact
        </Link>

        {!isLoggedIn ? (
          <>
            <Link
              to="/login"
              className="text-white font-medium hover:underline"
            >
              Login
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/upload"
              className="bg-[#FFCC00] text-[#2E0854] px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-300 transition flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              List Item
            </Link>

            <Link
              to="/messages"
              className="text-white hover:text-[#FFCC00] transition relative"
            >
              <MessageCircle className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FFCC00] text-[#2E0854] text-xs font-bold px-2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full bg-[#FFCC00] text-[#2E0854] flex items-center justify-center font-semibold cursor-pointer"
                onClick={() => setProfileMenuOpen((o) => !o)}
              >
                {initial}
              </div>
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 overflow-hidden"
                  >
                    <div className="px-4 py-2 text-gray-600 border-b">
                      Welcome, {user.username}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-1"
                    >
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-1"
                      >
                        <UserIcon className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <div className="sm:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <X className="text-white w-6 h-6" />
          ) : (
            <Menu className="text-white w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-16 left-0 w-full bg-[#3D1163] flex flex-col items-center gap-6 py-6 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/about"
              className="text-white text-lg"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-white text-lg"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="text-white text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <div className="text-white text-lg mb-2">
                  Welcome, {user.username}
                </div>
                <Link
                  to="/upload"
                  className="text-white text-lg flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <PlusCircle className="w-5 h-5" />
                  List Item
                </Link>
                <Link
                  to="/profile"
                  className="text-white text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/wishlist"
                  className="text-white text-lg flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </Link>
                <Link
                  to="/messages"
                  className="text-white text-lg flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <MessageCircle className="w-5 h-5" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="bg-[#FFCC00] text-[#2E0854] text-xs font-bold px-2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {user.user_role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-white text-lg flex items-center gap-1"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <button
                  className="text-white text-lg flex items-center gap-1"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
