import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import { sendVerificationEmail } from "../services/verifyApi";
import { motion } from "framer-motion";

const VerifyNotice = () => {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  
  useEffect(() => {
    // Get email from sessionStorage instead of localStorage
    const pendingEmail = sessionStorage.getItem("pendingVerificationEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      // If no pending email, redirect to login
      navigate("/login");
    }
  }, []);
  
  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No email address found");
      return;
    }
    
    setResending(true);
    try {
      await sendVerificationEmail(email);
      toast.success("Verification email resent. Please check your inbox.");
    } catch (err) {
      toast.error(err.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };
  
  return (
    // Existing component JSX...
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-8">
        <motion.div 
          className="bg-white rounded-2xl border-2 border-[#2E0854] shadow-lg p-8 w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-[#2E0854] mb-6 text-center">
            Verify Your Email
          </h2>
          
          <div className="mb-6 text-center">
            <svg className="w-16 h-16 mx-auto text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <p className="text-gray-700 mb-3 text-center">
            We've sent a verification email to:
          </p>
          <p className="text-[#2E0854] font-bold mb-5 text-center">
            {email || "your SFSU email address"}
          </p>
          
          <p className="text-gray-600 mb-6 text-center">
            Please check your email inbox and click the verification link to activate your account.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={handleResendEmail}
              className="bg-[#FFCC00] text-[#2E0854] py-3 rounded-full font-semibold hover:bg-yellow-300 transition flex items-center justify-center"
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
            
            <Link to="/login" className="text-center text-[#2E0854] font-medium hover:underline">
              Return to Login
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyNotice;