import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import config from "../config";
import AuthHelper from "../utils/authHelper";
import { sendVerificationEmail } from "../services/verifyApi";

const Login = () => {
    const [credentials, setCredentials] = useState({
        username: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState(null);
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${config.apiUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            // Handle unverified user specifically
            if (response.status === 403 && data.error?.includes("not verified")) {
                setUnverifiedEmail(data.unverified_email);
                setShowVerificationPrompt(true);
                toast.error("Your email is not verified. Please verify your email to log in.");
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Use AuthHelper to store authentication data
            AuthHelper.setToken(data.token);
            AuthHelper.setUser(data.user);

            toast.success("Successfully logged in!");

            // Navigate to home page
            navigate("/");
        } catch (error) {
            toast.error(error.message || "Login failed");
            console.error("Login error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedEmail) return;
        
        setLoading(true);
        try {
            await sendVerificationEmail(unverifiedEmail);
            toast.success("Verification email sent! Please check your inbox.");
            
            // Store email for the verification notice page
            sessionStorage.setItem("pendingVerificationEmail", unverifiedEmail);
            
            // Redirect to verification notice page
            navigate("/verify-notice");
        } catch (error) {
            toast.error("Failed to send verification email.");
            console.error("Send verification error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between bg-gray-100">
            <Navbar />

            <div className="flex items-center justify-center mt-12">
                <motion.div
                    className="bg-white rounded-2xl border-2 border-[#2E0854] 
                    shadow-lg p-8 w-full max-w-md"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold text-[#2E0854] mb-6 text-center">SFSU Login</h2>
                    
                    {showVerificationPrompt ? (
                        <div className="text-center">
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Email Verification Required</h3>
                                <p className="text-yellow-700 mb-4">
                                    Your account exists but your email ({unverifiedEmail}) has not been verified.
                                </p>
                                <button
                                    onClick={handleResendVerification}
                                    className="bg-[#FFCC00] text-[#2E0854] px-4 py-2 rounded-full 
                                    font-semibold hover:bg-yellow-300 transition w-full mb-2"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Resend Verification Email"}
                                </button>
                                <button
                                    onClick={() => setShowVerificationPrompt(false)}
                                    className="text-[#2E0854] px-4 py-2 rounded-full 
                                    font-medium hover:bg-gray-100 transition w-full border border-gray-300"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={credentials.username}
                                onChange={handleChange}
                                className="px-4 py-3 rounded-full border border-gray-300 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="px-4 py-3 rounded-full border border-gray-300 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-[#FFCC00] text-[#2E0854] py-3 rounded-full 
                                font-semibold hover:bg-yellow-300 transition flex items-center 
                                justify-center"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        </form>
                    )}
                    
                    <p className="text-center text-gray-600 mt-4">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-[#2E0854] font-medium hover:underline">
                            Register
                        </Link>
                    </p>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default Login;