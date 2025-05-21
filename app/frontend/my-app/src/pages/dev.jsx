import React from "react";
import { motion } from "framer-motion";
import dev from "/pictures/dev.jpg";

const Dev = () => {
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
                        src={dev}
                        alt="Dev Modi"
                        className="object-cover w-full h-full"
                    />
                </motion.div>

                <h2 className="text-gray-800 font-bold" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                    Dev Modi
                </h2>
                <p className="text-purple-600 font-medium" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>
                    Computer Science Student | Game Developer | AI Enthusiast
                </p>

                
                {[
                    "Hi, I’m Dev Modi, a Computer Science student at San Francisco State University with a passion for game development, AI, and full-stack web applications. I am from India and currently a Senior. Ever since I started programming, I’ve been fascinated by how technology can create immersive experiences, whether through interactive games, intelligent systems, or dynamic web applications.",
                    "I love building things, whether it's a Unity-based psychological horror game that challenges players' perceptions or a Django-powered web app that optimizes data retrieval in real time. My curiosity for AI and machine learning has led me to develop predictive models for stock prices, AI chatbots for job searching, and innovative game mechanics that enhance player engagement.",
                    "Beyond coding, I enjoy exploring new game mechanics, studying open-world and sandbox game design, and analyzing narrative structures in video games. When I’m not deep in development, you’ll probably find me reading about emerging AI trends, tinkering with new frameworks, playing video games, watching movies, or constantly improving my skills.",
                    "I’m always looking for new challenges and collaborations, whether it's building the next big indie game, enhancing web experiences, or developing smarter AI-driven solutions. I believe that technology is at its best when it brings people together and solves real-world problems. I’m eager to push the boundaries of what’s possible—let’s connect and build something extraordinary."
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

export default Dev;
