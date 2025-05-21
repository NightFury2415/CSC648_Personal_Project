import React from "react";
import { motion } from "framer-motion";
import daniel from "/pictures/daniel.jpg";

const Daniel = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-purple-700 
        via-pink-500 to-violet-950 flex flex-col items-center justify-center py-12 px-4 md:px-6">
            <motion.h1
                className="text-white font-bold text-center mb-4"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }} 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                About Me
            </motion.h1>

            <motion.div
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl 
                text-center w-full max-w-3xl flex flex-col items-center space-y-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                 
                <motion.div
                    className="rounded-full overflow-hidden border-8 border-purple-400 shadow-lg"
                    style={{ width: "clamp(8rem, 40vw, 16rem)", height: "clamp(8rem, 40vw, 16rem)" }} 
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <img
                        src={daniel}
                        alt="Daniel"
                        className="object-cover w-full h-full"
                    />
                </motion.div>

                <h2 className="text-gray-800 font-bold" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                    Daniel
                </h2>
                <p className="text-purple-600 font-medium" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>
                    Computer Science Student
                </p>

                <motion.p
                    className="text-gray-700 leading-relaxed px-4 sm:px-6 text-center"
                    style={{ fontSize: "clamp(0.9rem, 2.3vw, 1.1rem)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    Hi! I'm Daniel, from SFSU. I'm working on a bunch of things IT and programming-related. 
                    I mostly enjoy fixing problems, whether software, hardware, or anything really.
                </motion.p>

                <motion.p
                    className="text-gray-700 leading-relaxed px-4 sm:px-6 text-center"
                    style={{ fontSize: "clamp(0.9rem, 2.3vw, 1.1rem)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    Outside of coding, I like to walk, game, read, cook, and read more.
                </motion.p>

                <motion.div
                    className="mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                >
                    <a
                        href="/about"
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg 
                        shadow-lg hover:bg-purple-700 transition-all duration-300"
                        style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)" }}  
                    >
                        🔙 Back to Team
                    </a>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Daniel;
