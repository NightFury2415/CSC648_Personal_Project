import React from "react";
import { motion } from "framer-motion";
import hsueh from "/pictures/hsueh.jpg"; 

const Hsueh = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-teal-500 
        via-green-400 to-blue-700 flex flex-col items-center justify-center py-12 px-4 md:px-6">
            
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
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center 
                w-full max-w-3xl flex flex-col items-center space-y-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                
                <motion.div
                    className="rounded-full overflow-hidden border-8 border-teal-400 shadow-lg"
                    style={{ width: "clamp(8rem, 40vw, 16rem)", height: "clamp(8rem, 40vw, 16rem)" }}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <img
                        src={hsueh}
                        alt="Hsueh-Ta Lu"
                        className="object-cover w-full h-full"
                    />
                </motion.div>

                <h2 className="text-gray-800 font-bold" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                    Hsueh-Ta Lu
                </h2>
                <p className="text-teal-600 font-medium" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>
                    Computer Science Student | Software Developer | Tech Enthusiast
                </p>

                
                {[
                    "Hi, I’m Hsueh-Ta Lu, a senior majoring in Computer Science at San Francisco State University. I’m originally from Taiwan and have a strong passion for technology, software development, and problem-solving. My academic journey has given me experience in programming, data structures, and software engineering, and I enjoy tackling challenges that require logical thinking and creativity.",
                    "Beyond academics, I have a deep interest in cars and automotive technology. I love learning about vehicle engineering, performance tuning, and the latest innovations in the automotive industry. Whether it’s discussing the mechanics of an engine, the aerodynamics of a sports car, or advancements in electric and autonomous vehicles, I’m always eager to dive into the details and expand my knowledge.",
                    "In my free time, I enjoy exploring new technologies, keeping up with the latest tech and automotive trends, and working on personal coding projects. I always seek opportunities to grow my skills, collaborate with like-minded individuals, and apply my knowledge to real-world applications.",
                    "With a strong passion for both technology and cars, I hope to contribute to innovative projects that combine these two interests in the future, whether through software development, AI-driven automotive advancements, or other emerging technologies."
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
                        className="bg-teal-600 text-white px-6 py-3 rounded-lg 
                        shadow-lg hover:bg-teal-700 transition-all duration-300"
                        style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)" }}  
                    >
                        🔙 Back to Team
                    </a>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Hsueh;
