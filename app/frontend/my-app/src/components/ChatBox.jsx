import React, { useState, useEffect } from "react";
import axios from "axios";

const ChatBox = ({ senderId, receiverId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        fetchMessages();
    }, [senderId, receiverId]);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`/api/messages/conversation/${senderId}/${receiverId}`);
            setMessages(res.data);
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await axios.post("/api/messages/send", {
                sender_id: senderId,
                receiver_id: receiverId,
                content: newMessage,
            });
            setNewMessage("");
            fetchMessages();
        } catch (error) {
            console.error("Error sending message", error);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg border 
        border-[#2E0854] rounded-lg w-80">
            <div className="bg-[#2E0854] text-white p-3 rounded-t-lg font-semibold">
                Chat
            </div>
            <div className="p-3 h-64 overflow-y-auto">
                {messages.map((msg) => (
                    <div
                        key={msg.message_id}
                        className={`mb-2 ${msg.sender_id === senderId ? "text-right" : "text-left"}`}
                    >
                        <div className="inline-block bg-gray-200 px-3 py-1 rounded-full">
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="flex p-3 border-t">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow px-3 py-1 border rounded-full focus:outline-none"
                    placeholder="Type a message..."
                />
                <button type="submit" className="ml-2 bg-[#FFCC00] text-[#2E0854] 
                px-3 py-1 rounded-full">
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;