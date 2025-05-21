import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import config from "../config";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const DeleteAccount = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const deleteAccount = async () => {
      if (!token) {
        toast.error("Missing deletion token");
        setStatus("error");
        return;
      }

      try {
        const res = await axios.get(`${config.apiUrl}/verify/delete-account`, {
          params: { token },
        });

        if (res.status === 200) {
          setStatus("success");
          toast.success("Account successfully deleted");
          // Redirect to login after 3 seconds
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (err) {
        console.error("Error deleting account:", err);
        setStatus("error");
        toast.error(
          err.response?.data?.error || "Failed to delete account. Please try again."
        );
      }
    };

    deleteAccount();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-8">
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {status === "loading" && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-[#FFCC00] border-[#2E0854] rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-700">
                Processing your request...
              </h2>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-500 text-2xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                Account Deleted Successfully
              </h2>
              <p className="text-gray-600">
                The account has been removed from our system.
              </p>
              <p className="text-gray-500 mt-2">
                Redirecting you to the login page...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">×</span>
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Deletion Failed
              </h2>
              <p className="text-gray-600 mb-4">
                We couldn't delete the account. The link may be expired or invalid.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-[#FFCC00] text-[#2E0854] px-6 py-2 rounded-full hover:bg-yellow-400 transition"
              >
                Return to Login
              </button>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default DeleteAccount;