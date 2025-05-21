import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AboutUs from "./pages/about-us";
import Dev from "./pages/dev";
import Yash from "./pages/yash";
import Kyle from "./pages/kyle";
import Daniel from "./pages/daniel";
import Hsueh from "./pages/hsueh";
import HomePage from "./pages/home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ContactUs from "./pages/ContactUs";
import MessagePage from "./pages/message";
import ProductUpload from "./pages/upload";
import Wishlist from "./pages/cart";
import UserProfile from "./pages/UserProfile";
import UserPublicProfile from "./pages/UserPublicProfile";
import AnnouncementBanner from "./components/AnnouncementBanner";
import { Toaster } from "react-hot-toast";
import LeaveReviewPage from "./pages/Reviews";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyNotice from "./pages/VerifyNotice";
import DeleteAccount from "./pages/DeleteAccount";
import ReportUserForm from "./pages/ReportUserForm";
import config from "./config";
import "./utils/axiosConfig";

// Your Google Analytics Measurement ID
const GA_MEASUREMENT_ID = "G-JP9WHB9YYJ";

// Component to track page views
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag is defined (it should be, from your index.html)
    if (typeof window.gtag === "function") {
      // Send a page_view event when the route changes
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search, // Current path
        page_title: document.title, // Optional: current page title
        page_location: window.location.href, // Optional: full URL
      });
      // For debugging:
      // console.log(`GA Pageview Sent: ${location.pathname + location.search}`);
    }
  }, [location]); // Re-run this effect whenever the location changes

  return null; // This component does not render anything visible
}

function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (token && user?.user_id) {
      fetch(`${config.apiUrl}/wishlist/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem(
            `wishlist_user_${user.user_id}`,
            JSON.stringify(data)
          );
          localStorage.setItem("wishlist", JSON.stringify(data)); // optional fallback
        })
        .catch((err) => {
          console.error("Failed to fetch wishlist:", err);
        });
    }
  }, []);

  return (
    <Router>
      <PageViewTracker />
      <div className="bg-white py-3 shadow text-center text-xl font-bold text-[#2E0854]">
        SFSU Spring 2025 CSC648 Project
      </div>
      <AnnouncementBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/messages" element={<MessagePage />} />
        <Route path="/messages/:conversationId" element={<MessagePage />} />
        <Route path="/dev" element={<Dev />} />
        <Route path="/yash" element={<Yash />} />
        <Route path="/kyle" element={<Kyle />} />
        <Route path="/daniel" element={<Daniel />} />
        <Route path="/hsueh" element={<Hsueh />} />
        <Route path="/upload" element={<ProductUpload />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/user/:id" element={<UserPublicProfile />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/review" element={<LeaveReviewPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-notice" element={<VerifyNotice />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/edit-product/:product_id" element={<ProductUpload />} />
        <Route path="/report-user" element={<ReportUserForm />} />

        {/* Add a fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" reverseOrder={false} />
    </Router>
  );
}

export default App;
