import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import config from "../config";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

const LeaveReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sellerId, setSellerId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (location.state?.userId) {
      setSellerId(location.state.userId);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sellerId || !rating || !comment) {
      toast.error("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${config.apiUrl}/reviews/`,
        {
          seller_id: parseInt(sellerId),
          rating: parseInt(rating),
          comment: comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Review submitted!");
      navigate(`/user/${sellerId}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to submit review.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold text-[#2E0854] mb-4">
          Leave a Review
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Seller ID</label>
            <input
              type="number"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter seller's user ID"
              required
              disabled 
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Rating (1–5)</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Write your review..."
              rows={4}
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FFCC00] text-[#2E0854] py-2 rounded 
            font-semibold hover:bg-yellow-300 transition"
          >
            Submit Review
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default LeaveReviewPage;
