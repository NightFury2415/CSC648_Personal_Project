import React from "react";
import { motion } from "framer-motion";
import kyle from "/pictures/kyle.jpg"; 

const Kyle = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-cyan-500 
        via-blue-800 to-purple-900 flex flex-col items-center justify-center py-12 px-4 md:px-6">

            <motion.h1
                className="text-cyan-300 font-bold text-center mb-4"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                About Me
            </motion.h1>

            <motion.div
                className="bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-xl 
                text-center w-full max-w-3xl flex flex-col items-center space-y-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <motion.div
                    className="rounded-full overflow-hidden border-4 border-cyan-400 shadow-xl"
                    style={{ width: "clamp(8rem, 40vw, 16rem)", height: "clamp(8rem, 40vw, 16rem)" }}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <img
                        src={kyle}
                        alt="Kyle Yuen"
                        className="object-cover w-full h-full"
                    />
                </motion.div>

                <h2 className="text-gray-200 font-bold" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                    Kyle Yuen
                </h2>
                <p className="text-blue-300 font-medium" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>
                    Broke Computer Science Student | Hooper | Gamer
                </p>

                {[
                    "Hi, my name is Kyle Yuen. I am a senior at San Francisco State University with a keen interest in AI development. Born and raised in the Bay Area, specifically San Francisco, I've always been captivated by strategy games and critical thinking, and I hope to channel these passions into my future career.",
                    "My interests bridge the worlds of basketball and technology—a blend of physical activity and innovation that has fascinated me since childhood. The idea of creating something that merges these fields, especially using AI to enhance everyday life, is what drives my academic and career goals.",
                    "In terms of hobbies, I'm an average basketball player and gamer. I cherish spending quality time with friends, creating lasting memories. Cooking, a bit of baking, hiking, and watching Netflix are other activities that I enjoy.",
                    "Looking ahead, my ultimate goal is to integrate my love for basketball into my professional life. While my other hobbies hold a special place in my life, basketball is my true passion. I aim to find a career that allows me to engage with this sport in a meaningful way, though I'm open to any opportunity that allows me to apply my skills and interests effectively."
                ].map((text, index) => (
                    <motion.p
                        key={index}
                        className="text-gray-300 leading-relaxed px-4 sm:px-6 text-center text-wrap"
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
                        className="bg-blue-700 text-white px-6 py-3 rounded-lg 
                        shadow-lg hover:bg-blue-800 transition-all duration-300"
                        style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)" }} 
                    >
                        🔙 Back to Team
                    </a>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Kyle;
