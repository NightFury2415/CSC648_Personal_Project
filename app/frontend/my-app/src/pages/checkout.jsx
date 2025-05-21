import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CartContext } from '../components/CartContext';
import campusMap from '../assets/sfsu-campus-map.png';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-hot-toast';
import { MapPin, Calendar, Clock, User } from 'lucide-react';

const Checkout = () => {
    const { cartItems, removeFromCart } = useContext(CartContext);
    const [sellerGroups, setSellerGroups] = useState({});
    const [currentSellerIndex, setCurrentSellerIndex] = useState(0);
    const [sellerIds, setSellerIds] = useState([]);
    const [suggested, setSuggested] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Meeting suggestion for current seller
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingLocation, setMeetingLocation] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    
    // Get tomorrow's date as default
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setMeetingDate(tomorrow.toISOString().split('T')[0]);
    }, []);

    // Group items by seller when component loads
    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            navigate('/cart');
            return;
        }

        // Group cart items by seller
        const groups = {};
        cartItems.forEach(item => {
            if (item.isSelected) { // Only process selected items
                const sellerId = item.user_id;
                const sellerName = item.username || 'Unknown Seller';
                
                if (!groups[sellerId]) {
                    groups[sellerId] = {
                        sellerId: sellerId,
                        sellerName: sellerName,
                        items: []
                    };
                }
                
                groups[sellerId].items.push(item);
            }
        });
        
        setSellerGroups(groups);
        
        // Create an array of seller IDs for navigation
        const ids = Object.keys(groups);
        setSellerIds(ids);
        
        // Initialize suggested meeting info
        const initialSuggested = {};
        ids.forEach(id => {
            initialSuggested[id] = { location: '', time: '', date: '' };
        });
        setSuggested(initialSuggested);
        
    }, [cartItems, navigate]);

    const handleCheckoutSubmit = async (event) => {
        event.preventDefault();
        
        if (!meetingLocation || !meetingTime || !meetingDate) {
            toast.error('Please select a suggested meeting location, date and time');
            return;
        }
        
        const currentSellerId = sellerIds[currentSellerIndex];
        
        // Update suggested object
        setSuggested(prev => ({
            ...prev,
            [currentSellerId]: {
                location: meetingLocation,
                time: meetingTime,
                date: meetingDate
            }
        }));
        
        // If this is the last seller, proceed to creating all the messages
        if (currentSellerIndex >= sellerIds.length - 1) {
            try {
                setLoading(true);
                
                // Start conversation with each seller
                const token = localStorage.getItem('token');
                
                if (!token) {
                    toast.error('You must be logged in to contact sellers');
                    navigate('/login');
                    return;
                }
                
                const updatedSuggested = {
                    ...suggested,
                    [currentSellerId]: {
                        location: meetingLocation,
                        time: meetingTime,
                        date: meetingDate
                    }
                };
                
                // For each seller, create a conversation with meeting suggestion
                const conversationIds = [];
                
                for (const sellerId of sellerIds) {
                    const sellerGroup = sellerGroups[sellerId];
                    const meetingSuggestion = updatedSuggested[sellerId];
                    
                    // Format items for the message
                    const itemsList = sellerGroup.items.map(item => 
                        `${item.name} ($${item.price})`
                    ).join(', ');
                    
                    // Create the initial message with meeting suggestion
                    const initialMessage = `Hi! I'd like to purchase: ${itemsList}. I'm suggesting we meet at ${meetingSuggestion.location} on ${meetingSuggestion.date} at ${meetingSuggestion.time}. Does this work for you?`;
                    
                    // Choose the first item as the reference product
                    const referenceProduct = sellerGroup.items[0];
                    
                    // Create a conversation without formal meeting details
                    const response = await axios.post(
                        `${config.apiUrl}/messaging/conversations`,
                        {
                            product_id: referenceProduct.product_id,
                            recipient_id: sellerId,
                            subject: `Purchase of ${sellerGroup.items.length} item(s)`,
                            initial_message: initialMessage
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    
                    conversationIds.push(response.data.conversation_id);
                }
                
                // Clear cart items that were purchased
                const itemsToRemove = [];
                sellerIds.forEach(sellerId => {
                    sellerGroups[sellerId].items.forEach(item => {
                        itemsToRemove.push(item._cartId);
                    });
                });
                
                itemsToRemove.forEach(id => removeFromCart(id));
                
                toast.success('Purchase completed! Messages sent to sellers with your suggested meeting times');
                
                // Navigate to messages
                navigate('/messages', { state: { purchaseCompleted: true, conversationIds } });
                
            } catch (error) {
                console.error('Error contacting sellers:', error);
                toast.error('Failed to contact sellers. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            // Move to next seller
            setCurrentSellerIndex(prev => prev + 1);
            // Reset form for next seller
            setMeetingLocation('');
            setMeetingTime('');
        }
    };

    const locations = [
        { name: "J. Paul Leonard Library", top: "83%", left: "60%" },
        { name: "César Chávez Student Center", top: "65%", left: "60%" },
        { name: "Mashouf Wellness Center", top: "64%", left: "5%" },
        { name: "West Campus Green", top: "65%", left: "27%" }
    ];

    const times = [
        "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
        "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
    ];

    const handleLocationClick = (location) => {
        setMeetingLocation(location);
    };

    // If no sellers or loading, show loading state
    if (sellerIds.length === 0 || !sellerGroups || loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="max-w-4xl mx-auto p-6">
                    <h1 className="text-2xl font-bold text-center mb-6 text-[#2E0854]">Checkout</h1>
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        {loading ? (
                            <p>Processing your purchase...</p>
                        ) : (
                            <p>No items selected for checkout. Please return to your cart.</p>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Get current seller
    const currentSellerId = sellerIds[currentSellerIndex];
    const currentSellerGroup = sellerGroups[currentSellerId];

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-center mb-6 text-[#2E0854]">Complete Purchase</h1>
                
                {/* Progress indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#2E0854]">
                            Seller {currentSellerIndex + 1} of {sellerIds.length}
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round(((currentSellerIndex + 1) / sellerIds.length) * 100)}% Complete
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-[#2E0854] h-2.5 rounded-full" 
                            style={{ width: `${((currentSellerIndex + 1) / sellerIds.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Current seller details */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="flex items-center mb-4">
                        <User className="w-5 h-5 text-[#2E0854] mr-2" />
                        <h2 className="text-xl font-semibold text-[#2E0854]">
                            Purchasing from: {currentSellerGroup.sellerName}
                        </h2>
                    </div>
                    
                    <h3 className="font-medium mb-2">Items you're purchasing:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {currentSellerGroup.items.map((item) => (
                            <div key={item._cartId} className="flex items-center p-3 border rounded-lg">
                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3">
                                <img
                                    src={
                                        item.images?.[0]
                                        ? item.images[0].startsWith("/")
                                            ? `${config.apiUrl}${item.images[0]}`
                                            : item.images[0]
                                        : "/static/images/placeholder.png"
                                    }
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/static/images/placeholder.png";
                                    }}
                                    />
                                </div>
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-[#2E0854] font-bold">${item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-center mb-4">Suggest Meeting Details</h2>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <InfoIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    This is just a suggested meeting time and place. You'll be able to coordinate the final details with the seller in your messages.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <Calendar className="w-5 h-5 text-[#2E0854] mr-2" />
                            <label className="font-medium">Suggest a Date</label>

                        </div>
                        <input
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-[#2E0854]"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <Clock className="w-5 h-5 text-[#2E0854] mr-2" />
                            <label className="font-medium">Suggest a Time</label>
                        </div>
                        <select
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-[#2E0854]"
                            required
                        >
                            <option value="">Select a time</option>
                            {times.map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <MapPin className="w-5 h-5 text-[#2E0854] mr-2" />
                            <label className="font-medium">Suggest a Meeting Location</label>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Map with clickable areas */}
                            <div className="relative w-full md:w-3/4">
                                <img src={campusMap} alt="SFSU Campus Map" className="w-full rounded-lg" />
                                {locations.map((location) => (
                                    <div
                                        key={location.name}
                                        className="absolute group cursor-pointer"
                                        style={{ top: location.top, left: location.left }}
                                        onClick={() => handleLocationClick(location.name)}
                                    >
                                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {location.name}
                                        </div>
                                        <div 
                                            className={`px-1 py-0.5 text-xs rounded-full transition-transform hover:scale-110 ${
                                                meetingLocation === location.name 
                                                ? 'bg-[#2E0854] text-white scale-125' 
                                                : 'bg-red-600 text-white'
                                            }`}
                                        >
                                            {meetingLocation === location.name ? '✓' : '●'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Instruction Tooltip Box */}
                            <div className="md:w-1/4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
                                <h3 className="font-semibold mb-2 text-yellow-800">Select Meeting Location:</h3>
                                <ul className="text-sm text-yellow-900 list-disc list-inside">
                                    <li>Click a red marker on the map</li>
                                    <li>Chosen location will be highlighted</li>
                                    <li>Choose a central, public location</li>
                                </ul>
                            </div>
                        </div>

                        {/* Selected location display */}
                        {meetingLocation && (
                            <div className="mt-2 p-2 bg-[#2E0854] bg-opacity-10 rounded-lg">
                                <p className="font-medium flex items-center">
                                    <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
                                    Suggesting Meeting at: <span className="ml-1 text-[#2E0854]">{meetingLocation}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit button */}
                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={!meetingLocation || !meetingTime || !meetingDate}
                            className="w-full bg-[#2E0854] text-white p-3 rounded font-medium hover:bg-purple-900 transition disabled:opacity-50 disabled:cursor-not-allowed"

                        >
                            {currentSellerIndex >= sellerIds.length - 1 
                                ? 'Complete Purchase & Contact Sellers' 
                                : `Continue to Next Seller (${currentSellerIndex + 1}/${sellerIds.length})`
                            }
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
};

// Simple Info icon component
const InfoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

// Simple Check icon component 
const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

export default Checkout;