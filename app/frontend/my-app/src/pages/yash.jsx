import React from "react";
import { motion } from "framer-motion";
import yash1 from "/pictures/yash1.jpg";

const Yash = () => {
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
                        src={yash1}
                        alt="Yash Pachori"
                        className="object-cover w-full h-full"
                    />
                </motion.div>

                <h2 className="text-gray-800 font-bold" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                    Yash Pachori
                </h2>
                <p className="text-purple-600 font-medium" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>
                    Computer Science Student
                </p>

                {[
                    "Hi! I'm Yash Pachori, a Computer Science major at San Francisco State University. I love solving problems and using my mind in creative ways.",
                    "I volunteer at the Hindu Heritage Hall at the Shiva-Vishnu Temple in Livermore, CA, where I work on various programming-related projects such as writing APIs, building web pages, and researching new and innovative technologies for future exhibits.",
                    "I enjoy trying to figure out challenging concepts and implementing them in different ways in my projects.",
                    "Outside of coding, I like to play guitar, go to the gym, read books, and cook food."
                ].map((text, index) => (
                    <motion.p
                        key={index}
                        className="text-gray-700 leading-relaxed px-4 sm:px-6 text-center text-wrap"
                        style={{ fontSize: "clamp(0.9rem, 2.3vw, 1.1rem)" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                        {text}
                    </motion.p>
                ))}

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

export default Yash;
