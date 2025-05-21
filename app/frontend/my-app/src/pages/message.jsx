import React, { useState, useEffect, useRef, } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MeetingLocationMap from "../components/MeetingLocationMap";
import axios from "axios";
import config from "../config";
import { 
  Send, 
  ChevronLeft,
  User,
  DollarSign,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";

const MessagePage = () => {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // States
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [hoveredConversation, setHoveredConversation] = useState(null);
  
  // For showing purchase completed notification
  const [showPurchaseNotice, setShowPurchaseNotice] = useState(false);
  
  // For dynamic height animation
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef(null);
  
  // Force re-render key
  const [renderKey, setRenderKey] = useState(0);

  // Move image management state and functions to top level
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/pictures/placeholder.png";
    return imagePath.startsWith("/") ? `${config.apiUrl}${imagePath}` : imagePath;
  };

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
      return;
    }

    // Check if we're coming from checkout with purchase completed
    if (location.state?.purchaseCompleted) {
      setShowPurchaseNotice(true);
      setTimeout(() => {
        setShowPurchaseNotice(false);
      }, 5000);
    }

    // Fetch conversations first
    fetchConversations();
    
    // Then fetch specific conversation if ID is provided
    if (conversationId) {
      fetchConversationDetails(conversationId);
      fetchMessages(conversationId);
    } else {
      setLoading(false);
    }
  }, [conversationId, location, navigate]);

  useEffect(() => {
    // Increment render key to force re-render when conversation changes
    setRenderKey(prev => prev + 1);
  }, [conversationId]);

  useEffect(() => {
    if (contentRef.current && showProductDetails) {
      // Create an image object to ensure it's loaded before measuring
      const img = contentRef.current.querySelector('img');
      
      if (img && !img.complete) {
        // If image isn't loaded yet, wait for it
        img.onload = () => {
          setContentHeight(contentRef.current.scrollHeight);
        };
      } else {
        // Measure immediately if image is already loaded
        setContentHeight(contentRef.current.scrollHeight);
      }
    }
  }, [selectedConversation, showProductDetails]);

  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current && showProductDetails) {
        setContentHeight(contentRef.current.scrollHeight);
      }

    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showProductDetails]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/messaging/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(response.data || []);

      // If we're coming from checkout with conversationIds, select the first one
      if (location.state?.conversationIds?.length > 0 && !conversationId) {
        navigate(`/messages/${location.state.conversationIds[0]}`);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    }
  };

  const fetchConversationDetails = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/messaging/conversations/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedConversation(response.data);
    } catch (error) {
      console.error("Error fetching conversation details:", error);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/messaging/conversations/${id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(response.data || []);
      setLoading(false);

      // Mark messages as read
      await axios.post(
        `${config.apiUrl}/messaging/conversations/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${config.apiUrl}/messaging/conversations/${conversationId}/messages`,
        { message_text: newMessage },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewMessage("");
      fetchMessages(conversationId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleSendMeetingSuggestion = async (suggestionMessage) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${config.apiUrl}/messaging/conversations/${conversationId}/messages`,
        { message_text: suggestionMessage },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchMessages(conversationId);
      toast.success("Meeting suggestion sent");
    } catch (error) {
      console.error("Error sending meeting suggestion:", error);
      toast.error("Failed to send suggestion");
    }
  };

  const handleSelectConversation = (id) => {
    navigate(`/messages/${id}`);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Determine if current user is buyer or seller
  const isUserBuyer = () => {
    if (!selectedConversation || !user) return false;
    
    // Check if the other participant is the seller
    return selectedConversation.other_participant.role === 'seller';
  };

  // Navigate to a user's profile page
  const goToUserProfile = (userId, e) => {
    if (e) e.stopPropagation();
    if (userId) {
      navigate(`/user/${userId}`);
    }
  };

  // Toggle product details with animation
  const toggleProductDetails = () => {
    setShowProductDetails(!showProductDetails);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto p-4 md:p-8 pb-16">
        <h1 className="text-2xl font-bold mb-4 text-[#2E0854]">Messages</h1>
        
        {/* Purchase completed notification */}
        {showPurchaseNotice && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Thank you for your meeting suggestion time! Messages have been sent to sellers with your suggested meeting times and you can arrange further.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar with conversations list */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow h-full flex flex-col">
              <div className="bg-[#2E0854] text-white px-4 py-3 rounded-t-lg font-semibold">
                My Conversations
              </div>

              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500 flex-grow">
                  You don't have any conversations yet.
                </div>
              ) : (
                <div className="divide-y overflow-y-auto flex-grow">
                  {conversations.map((convo) => (
                    <div
                      key={convo.conversation_id}
                      onClick={() => handleSelectConversation(convo.conversation_id)}
                      onMouseEnter={() => setHoveredConversation(convo.conversation_id)}
                      onMouseLeave={() => setHoveredConversation(null)}
                      className={`p-4 cursor-pointer flex items-start transition-colors duration-200 ${
                        String(convo.conversation_id) === String(conversationId)
                          ? "bg-gray-100"
                          : ""
                      } ${
                        hoveredConversation === convo.conversation_id
                          ? "bg-yellow-50"
                          : ""
                      } ${
                        convo.unread_count > 0
                          ? "border-l-4 border-[#FFCC00]"
                          : ""
                      }`}
                    >
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-12 h-12 rounded-md bg-gray-200 overflow-hidden">
                          <img
                            src={
                              convo.product?.images?.[0]
                                ? getImageUrl(convo.product.images[0])
                                : "/pictures/placeholder.png"
                            }
                            alt={convo.product?.name || "Product"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/pictures/placeholder.png";
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-medium text-[#2E0854] truncate">
                            {convo.product?.name}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {new Date(convo.last_message_time).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Make username clickable - with better styling */}
                        <div className="flex items-center">
                          <span className="text-xs text-gray-600">with</span>
                          <button 
                            className="text-xs ml-1 text-gray-600 hover:text-[#2E0854] hover:underline flex items-center"
                            onClick={(e) => goToUserProfile(convo.other_participant?.user_id, e)}
                          >
                            <User className="w-3 h-3 mr-1 inline-block" />
                            <span className="font-medium">{convo.other_participant?.username}</span>
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 truncate mt-1">
                          {convo.last_message_text}
                        </p>

                        {convo.unread_count > 0 && (
                          <div className="mt-1">
                            <span className="bg-[#FFCC00] text-[#2E0854] text-xs font-bold px-2 py-1 rounded-full">
                              {convo.unread_count} new
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
                <button
                  onClick={() => fetchConversations()}
                  className="text-[#2E0854] text-sm font-medium hover:underline"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Right side with messages */}
          <div className="md:col-span-2">
            {!conversationId ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-500 mb-4">
                  Select a conversation to view messages
                </div>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                {/* Product details section - Fixed with proper icon handling */}
                {selectedConversation && showProductDetails && (
                  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <div className="w-full aspect-square bg-white rounded border overflow-hidden relative">
                          <img
                            src={
                              selectedConversation.product.images?.[currentImageIndex]
                                ? getImageUrl(selectedConversation.product.images[currentImageIndex])
                                : "/pictures/placeholder.png"
                            }
                            alt={selectedConversation.product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/pictures/placeholder.png";
                            }}
                          />
                          
                          {selectedConversation.product.images?.length > 1 && (
                            <div className="absolute inset-x-0 bottom-0 flex justify-center space-x-2 p-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCurrentImageIndex((prev) => 
                                    prev === 0 
                                      ? selectedConversation.product.images.length - 1 
                                      : prev - 1
                                  );
                                }}
                                className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                              </button>
                              <span className="bg-white px-2 py-1 rounded-md text-xs">
                                {currentImageIndex + 1} / {selectedConversation.product.images.length}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCurrentImageIndex((prev) => 
                                    (prev + 1) % selectedConversation.product.images.length
                                  );
                                }}
                                className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Thumbnails */}
                        {selectedConversation.product.images?.length > 1 && (
                          <div className="mt-2 grid grid-cols-5 gap-2">
                            {selectedConversation.product.images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCurrentImageIndex(idx);
                                }}
                                className={`aspect-square rounded overflow-hidden border-2 ${
                                  currentImageIndex === idx ? 'border-[#2E0854]' : 'border-transparent'
                                }`}
                              >
                                <img
                                  src={getImageUrl(img)}
                                  alt={`${selectedConversation.product.name} thumbnail ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/pictures/placeholder.png";
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <h3 className="font-semibold text-lg text-[#2E0854] mb-1">
                          {selectedConversation.product.name}
                        </h3>
                        <div className="flex items-center text-lg font-bold text-[#2E0854] mb-2">
                          <DollarSign className="w-5 h-5" />
                          {selectedConversation.product.price?.toFixed(2)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {selectedConversation.product.description || "No description available"}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">
                              {isUserBuyer() ? 'Seller' : 'Buyer'}:
                            </p>
                            <button 
                              onClick={(e) => goToUserProfile(selectedConversation.other_participant.user_id, e)}
                              className="font-semibold flex items-center hover:text-[#2E0854] hover:underline"
                            >
                              <User className="w-3 h-3 mr-1 inline-block" />
                              <span>@{selectedConversation.other_participant.username}</span>
                            </button>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Status:</p>
                            <p className="font-semibold capitalize">
                              {selectedConversation.product.status || "Available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message frame - now independent of product details */}
                <div 
                  className="bg-white rounded-lg shadow flex flex-col h-auto md:h-[700px] lg:h-[800px]"
                  style={{ 
                    maxHeight: showProductDetails ? '500px' : undefined,
                    minHeight: '350px'
                  }}
                >
                  {/* Conversation header */}
                  <div className="bg-[#2E0854] text-white px-4 py-3 rounded-t-lg font-semibold flex items-center">
                    <button
                      onClick={() => navigate("/messages")}
                      className="mr-2 md:hidden"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                      {selectedConversation && (
                        <>
                          <div className="flex items-center">
                            <ShoppingBag className="w-4 h-4 mr-1" />
                            {selectedConversation.product.name}
                          </div>
                          <button 
                            onClick={(e) => goToUserProfile(selectedConversation.other_participant.user_id, e)}
                            className="text-xs text-gray-300 hover:text-white flex items-center hover:underline"
                          >
                            <User className="w-3 h-3 mr-1 inline-block" />
                            <span>{isUserBuyer() ? 'Seller' : 'Buyer'}: {selectedConversation.other_participant.username}</span>
                          </button>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={toggleProductDetails}
                      className="p-1 rounded transition-colors duration-200 bg-[#FFCC00] text-[#2E0854] hover:bg-purple-800 hover:text-white flex items-center gap-1"
                    >
                      Product Details
                      {showProductDetails ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>

                  {/* Messages area with proper height calculation */}
                  <div className="flex-grow overflow-y-auto p-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.message_id}
                        className={`flex ${
                          user && msg.sender_id === user.user_id
                            ? "justify-end"
                            : "justify-start"
                        } mb-4`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-lg ${
                            user && msg.sender_id === user.user_id
                              ? "bg-[#FFCC00] text-[#2E0854]"
                              : "bg-[#2E0854] text-white"
                          }`}
                        >
                          <div className="text-sm">{msg.message_text}</div>
                          <div className="text-xs opacity-70 text-right mt-1 flex justify-end items-center">
                            {user && msg.sender_id !== user.user_id ? (
                              <button
                                onClick={(e) => goToUserProfile(msg.sender_id, e)}
                                className="mr-1 hover:underline flex items-center"
                              >
                                <User className="w-3 h-3 mr-1 inline-block" />
                                <span>{msg.sender_username}</span>
                              </button>
                            ) : (
                              <span className="mr-1">{msg.sender_username}</span>
                            )}
                            {new Date(msg.sent_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message input and meeting map - fixed positioning with proper stacking */}
                  <div className="border-t border-gray-200 relative bg-white" style={{ zIndex: 10 }}>
                    {isUserBuyer() && selectedConversation && (
                      <div className="px-4 py-2 border-b relative" style={{ zIndex: 100 }}>
                        <div className="relative">
                          <MeetingLocationMap 
                            onSendMeetingSuggestion={handleSendMeetingSuggestion} 
                          />
                        </div>
                      </div>
                    )}
                    
                    <form 
                      onSubmit={handleSendMessage} 
                      className="p-4 flex items-center"
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-[#2E0854]"
                      />
                      <button
                        type="submit"
                        className="bg-[#FFCC00] text-[#2E0854] font-semibold px-4 py-2 rounded-r hover:bg-yellow-300 flex items-center"
                      >
                        <Send size={18} className="mr-2" />
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MessagePage;