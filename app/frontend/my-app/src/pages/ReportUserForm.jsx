import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";

const ReportUserForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reportedUserId = location.state?.userId;

  const [reason, setReason] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${config.apiUrl}/reports/users`,
        {
          reported_user_id: reportedUserId,
          reason,
          additional_comments: additionalComments,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Report submitted successfully.");
      setTimeout(() => navigate(-1), 2000); // Go back after 2 seconds
    } catch (err) {
      setError("Failed to submit report. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#2E0854] mb-4">Report User</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-medium">Reason *</label>
          <textarea
            className="w-full border rounded p-2 mb-4"
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <label className="block mb-2 font-medium">Additional Comments (optional)</label>
          <textarea
            className="w-full border rounded p-2 mb-4"
            rows="3"
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
          />

          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserForm;