import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; 

const ContactUs = () => {
    return (
        <div className="min-h-screen flex flex-col justify-between bg-gray-100">
            <Navbar />

            <div className="flex items-center justify-center mt-12">
                <motion.div
                    className="bg-white rounded-2xl border-2 border-[#2E0854] 
                    shadow-lg p-8 w-full max-w-xl"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold text-[#2E0854] mb-6 text-center">Contact Us</h2>
                    <form className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Your Full Name"
                            className="px-4 py-3 rounded-full border border-gray-300 
                            shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                            placeholder-gray-500"
                        />
                        <input
                            type="email"
                            placeholder="Your Email"
                            className="px-4 py-3 rounded-full border border-gray-300 
                            shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                            placeholder-gray-500"
                        />
                        <textarea
                            rows="4"
                            placeholder="Your Message"
                            className="px-4 py-3 rounded-2xl border border-gray-300 
                            shadow focus:outline-none focus:ring-2 focus:ring-[#FFCC00] 
                            placeholder-gray-500 resize-none"
                        ></textarea>
                        <button
                            type="submit"
                            className="bg-[#FFCC00] text-[#2E0854] py-3 rounded-full 
                            font-semibold hover:bg-yellow-300 transition"
                        >
                            Send Message
                        </button>
                    </form>
                    <p className="text-center text-gray-600 mt-4">
                        We'll get back to you within 1-2 business days.
                    </p>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default ContactUs;
