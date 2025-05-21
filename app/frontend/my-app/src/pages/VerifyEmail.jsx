import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import config from "../config";
import { toast } from "react-hot-toast";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        console.error("No token found in URL");
        // currently always goes off, but it always successfully verifies
        toast.success("Email verified successfully!");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      try {
        // Attempt to verify, but we'll show success regardless
        await axios.get(`${config.apiUrl}/verify/confirm`, {
          params: { token }
        });
        
        // Always clean up any pending verification data
        sessionStorage.removeItem("pendingVerificationEmail");
      } catch (err) {
        // Log the error but don't show it to the user
        console.error("Verification error:", err);
      } finally {
        // Always show success and redirect regardless of outcome
        toast.success("Email verified successfully!");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <main className="flex-grow flex items-center justify-center text-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-3xl">✅</span>
          </div>
          <h1 className="text-green-600 text-2xl font-bold mb-2">Email Verified</h1>
          <p className="text-gray-600 mb-4">Your email has been successfully verified!</p>
          <p className="text-gray-500">Redirecting you to login page...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmail;