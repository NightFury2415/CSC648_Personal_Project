import React, { useState } from "react";
import axios from "axios";

const SupportChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        /*
        try {
            const res = await axios.post("http://localhost:5000/api/chatbot", {
                message: input,
            });
            const botReply = { sender: "bot", text: res.data.reply };
            setMessages((prev) => [...prev, botReply]);
        } catch (error) {
            console.error("Error fetching bot reply:", error);
        }
        */
    };

    return (
        <div className="fixed bottom-6 left-6">
            {isOpen ? (
                <div className="bg-white w-80 rounded-lg shadow-lg border border-[#2E0854]">
                    <div className="bg-[#2E0854] text-white p-3 
                    rounded-t-lg flex justify-between items-center">
                        <span>Support Chat</span>
                        <button onClick={() => setIsOpen(false)}>✖️</button>
                    </div>
                    <div className="p-3 h-64 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}
                            >
                                <div
                                    className={`inline-block px-3 py-1 rounded-full ${
                                        msg.sender === "user"
                                            ? "bg-gray-200"
                                            : "bg-[#FFCC00] text-[#2E0854]"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={sendMessage} className="flex p-3 border-t">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-grow px-3 py-1 border rounded-full focus:outline-none"
                            placeholder="Ask me anything..."
                        />
                        <button type="submit" className="ml-2 bg-[#FFCC00] 
                        text-[#2E0854] px-3 py-1 rounded-full">
                            Send
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#FFCC00] text-[#2E0854] px-4 py-2 
                    rounded-full shadow-lg hover:bg-yellow-300"
                >
                    Need Help?
                </button>
            )}
        </div>
    );
};

export default SupportChatBot;

