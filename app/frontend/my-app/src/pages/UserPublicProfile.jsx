import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import config from "../config";

const UserPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchReviews();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.apiUrl}/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${config.apiUrl}/reviews/${id}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const averageRating = reviews.length
  ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
        {profile ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={profile.profile_picture_url || "/default-profile.png"}
                alt="profile"
                className="w-20 h-20 rounded-full border-4 border-[#FFCC00] object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold text-[#2E0854]">
                  @{profile.username}
                </h2>
                <p className="text-gray-600 text-sm">
                  Member since:{" "}
                  {new Date(profile.date_joined).toLocaleDateString()}
                </p>
                <p className="text-sm text-[#2E0854]">
                  Rating: {averageRating.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mb-6 flex gap-4">
              <button
                onClick={() =>
                  navigate("/review", { state: { userId: profile.user_id } })
                }
                className="bg-[#2E0854] text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-900 transition"
              >
                Leave a Review
              </button>

              <button
                onClick={() =>
                  navigate("/report-user", { state: { userId: profile.user_id } })
                }
                className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700 transition"
              >
                Report
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-[#2E0854] mt-6 mb-2">
              Reviews
            </h3>
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.review_id}
                    className="border p-4 rounded bg-gray-50"
                  >
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg
                          key={i}
                          className="w-5 h-5"
                          fill={r.rating >= i ? "#FFD700" : "#E5E7EB"}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674h4.912c.969 0 1.371 1.24.588 1.81l-3.975 2.89 1.518 4.674c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.975 2.89c-.784.57-1.838-.197-1.539-1.118l1.518-4.674-3.975-2.89c-.783-.57-.38-1.81.588-1.81h4.912l1.518-4.674z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-800">{r.comment}</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default UserPublicProfile;