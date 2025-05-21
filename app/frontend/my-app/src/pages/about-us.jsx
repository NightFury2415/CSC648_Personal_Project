import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import dev from "/pictures/dev.jpg";
import yash from "/pictures/yash1.jpg";
import kyle from "/pictures/kyle.jpg";
import hsueh from "/pictures/hsueh.jpg";
import daniel from "/pictures/daniel.jpg";

const teamMembers = [
    { name: "Dev", role: "Team Lead, Front-End, Back-End, Database", image: dev, path: "/dev" },
    { name: "Daniel", role: "Tech Lead and GitHub", image: daniel, path: "/daniel" },
    { name: "Yash", role: "Back-End Lead Developer", image: yash, path: "/yash" },
    { name: "Kyle", role: "Front-End Lead Developer", image: kyle, path: "/kyle" },
    { name: "Hsueh", role: "Scrum Master", image: hsueh, path: "/hsueh" },
];

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r 
        from-purple-700 via-pink-500 to-violet-950 flex flex-col 
        items-center justify-start py-0 px-0">
            <Navbar />

            <motion.h1
                className="text-white text-center font-bold mb-4 mt-8"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Meet the Team!
            </motion.h1>
            <motion.p
                className="text-white text-center mb-10 max-w-2xl"
                style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                Meet our team of dedicated professionals who try our best to not fail.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
                {teamMembers.map((member, index) => {
                    const isDev = member.name === "Dev";

                    return (
                        <motion.div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-lg 
                            text-center w-full sm:w-72 mx-auto"
                            initial={{
                                opacity: 0,
                                scale: 0.8,
                                y: isDev ? 0 : -50,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.6,
                                delay: isDev ? 0.2 : 0.6 + index * 0.15,
                                type: "spring",
                                stiffness: 100,
                            }}
                        >
                            <motion.img
                                className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 
                                md:h-40 object-cover rounded-full mx-auto mb-4 
                                border-4 border-purple-300"
                                src={member.image}
                                alt={member.name}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: isDev ? 0.2 : 0.6 + index * 0.15 }}
                            />
                            <h3 className="text-gray-700 font-semibold">
                                <Link to={member.path} className="text-lg sm:text-xl 
                                hover:text-purple-500 transition">
                                    {member.name}
                                </Link>
                            </h3>
                            <p className="text-purple-600 font-medium text-sm sm:text-base">
                                {member.role}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AboutUs;
