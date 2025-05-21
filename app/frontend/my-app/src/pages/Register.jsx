import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import config from "../config";
import { sendVerificationEmail } from "../services/verifyApi";

const Register = () => {
    const [userData, setUserData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "", // Add this new field
        first_name: "",
        last_name: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const patterns = {
        username: /^[a-zA-Z0-9_]{4,20}$/,
        email: /^[a-zA-Z0-9._-]+@sfsu\.edu$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        name: /^[a-zA-Z\s-']{2,30}$/
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!patterns.username.test(userData.username)) {
            newErrors.username = "Username must be 4-20 characters, only letters, numbers, and underscores";
        }
        
        if (!patterns.email.test(userData.email)) {
            newErrors.email = "Please enter a valid SFSU email (@sfsu.edu)";
        }
        
        if (!patterns.password.test(userData.password)) {
            newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
        }
        
        if (!patterns.name.test(userData.first_name)) {
            newErrors.first_name = "Please enter a valid first name (2-30 letters)";
        }
        
        if (!patterns.name.test(userData.last_name)) {
            newErrors.last_name = "Please enter a valid last name (2-30 letters)";
        }

        if (userData.password !== userData.confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }
    
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let trimmedValue = value;
        if (name === 'username' && value.length > 20) {
            trimmedValue = value.slice(0, 20);
        } else if ((name === 'first_name' || name === 'last_name') && value.length > 30) {
            trimmedValue = value.slice(0, 30);
        } else if (name === 'password' && value.length > 64) {
            trimmedValue = value.slice(0, 64);
        }

        setUserData({
            ...userData,
            [name]: trimmedValue
        });

        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
      
        setLoading(true);
        try {
          // 1. register the user
          const res = await fetch(`${config.apiUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Registration failed");
      
          // 2. fire the e-mail **before** any UI change
          await sendVerificationEmail(userData.email);
      
          // 3. stash auth info
          sessionStorage.setItem("pendingVerificationEmail", userData.email);

      
          // 4. UX
          toast.success("Registration successful! Check your SFSU inbox to verify.");
          navigate("/verify-notice");
        } catch (err) {
          toast.error(err.message || "Registration failed");
        } finally {
          setLoading(false);
        }
      };

    return (
        <div className="min-h-screen flex flex-col justify-between bg-gray-100">
            <Navbar />
            <div className="flex items-center justify-center mt-12">
                <motion.div
                    className="bg-white rounded-2xl border-2 border-[#2E0854] shadow-lg 
                    p-8 w-full max-w-md"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold text-[#2E0854] mb-6 text-center">
                        SFSU Registration
                    </h2>
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-sm font-medium text-gray-700 ml-2 block">
                                <span className="text-red-500">*</span> First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                placeholder="First Name"
                                value={userData.first_name}
                                onChange={handleChange}
                                className={`px-4 py-3 rounded-full border ${errors.first_name ? 
                                    'border-red-500' : 'border-gray-300'} 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500 w-full`}
                                required
                            />
                            {errors.first_name && (
                                <p className="text-red-500 text-sm mt-1 ml-4">{errors.first_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 ml-2 block">
                                <span className="text-red-500">*</span> Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                placeholder="Last Name"
                                value={userData.last_name}
                                onChange={handleChange}
                                className={`px-4 py-3 rounded-full border ${errors.last_name ? 
                                    'border-red-500' : 'border-gray-300'} 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500 w-full`}
                                required
                            />
                            {errors.last_name && (
                                <p className="text-red-500 text-sm mt-1 ml-4">{errors.last_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 ml-2 block">
                                <span className="text-red-500">*</span> Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Username (4-20 characters)"
                                value={userData.username}
                                onChange={handleChange}
                                className={`px-4 py-3 rounded-full border ${errors.username ? 
                                    'border-red-500' : 'border-gray-300'} 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500 w-full`}
                                required
                            />
                            {errors.username && (
                                <p className="text-red-500 text-sm mt-1 ml-4">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 ml-2 block">
                                <span className="text-red-500">*</span> SFSU Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="SFSU Email (@sfsu.edu)"
                                value={userData.email}
                                onChange={handleChange}
                                className={`px-4 py-3 rounded-full border ${errors.email ? 
                                    'border-red-500' : 'border-gray-300'} 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500 w-full`}
                                required
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1 ml-4">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 ml-2 block">
                                <span className="text-red-500">*</span> Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={userData.password}
                                onChange={handleChange}
                                className={`px-4 py-3 rounded-full border ${errors.password ? 
                                    'border-red-500' : 'border-gray-300'} 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500 w-full`}
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1 ml-4">{errors.password}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1 ml-4">
                                Password must be at least 8 characters with uppercase, lowercase, number, and special character
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 ml-2 block">
                                <span className="text-red-500">*</span> Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={userData.confirmPassword}
                                onChange={handleChange}
                                className={`px-4 py-3 rounded-full border ${errors.confirmPassword ? 
                                    'border-red-500' : 'border-gray-300'} 
                                shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                                placeholder-gray-500 w-full`}
                                required
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1 ml-4">{errors.confirmPassword}</p>
                            )}
                        </div>


                        <button
                            type="submit"
                            className="bg-[#FFCC00] text-[#2E0854] py-3 rounded-full 
                            font-semibold hover:bg-yellow-300 transition flex items-center 
                            justify-center mt-2"
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[#2E0854] font-medium hover:underline">
                            Login
                        </Link>
                    </p>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;
