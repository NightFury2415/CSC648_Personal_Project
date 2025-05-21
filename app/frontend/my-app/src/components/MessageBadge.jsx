// app/frontend/my-app/src/components/MessageBadge.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import config from '../config';

const MessageBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchUnreadCount();
      
      // Set up an interval to check for new messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${config.apiUrl}/messaging/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <Link to="/messages" className="relative">
      <MessageCircle className="text-white w-6 h-6 cursor-pointer" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#FFCC00] text-[#2E0854] text-xs font-bold px-2 rounded-full">
          {unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageBadge;