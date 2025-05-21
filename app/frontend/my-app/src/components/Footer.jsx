import React from "react";

const Footer = () => {
    return (
        <footer className="bg-[#2E0854] text-white py-6 mt-12 shadow-inner">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm">&copy; {new Date().getFullYear()} Gator Market - San Francisco State University</p>
            </div>
        </footer>
    );
};

export default Footer;
