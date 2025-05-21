import React, { useState, useEffect } from "react";
import { MapPin, Calendar, Clock } from "lucide-react";
import campusMap from "../assets/sfsu-campus-map.png";

const MeetingLocationMap = ({ onSendMeetingSuggestion }) => {
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const locations = [
    { name: "J. Paul Leonard Library", top: "83%", left: "60%" },
    { name: "César Chávez Student Center", top: "65%", left: "60%" },
    { name: "Mashouf Wellness Center", top: "64%", left: "5%" },
    { name: "West Campus Green", top: "65%", left: "27%" },
  ];

  const times = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  const handleLocationClick = (location) => {
    setMeetingLocation((prev) => (prev === location ? "" : location));
  };

  const handleSendSuggestion = () => {
    if (!meetingLocation || !meetingTime || !meetingDate) return;

    const suggestionMessage = `I'd like to meet at ${meetingLocation} on ${meetingDate} at ${meetingTime}. Does this work for you?`;
    onSendMeetingSuggestion(suggestionMessage);
    setIsVisible(false);
  };

  const InfoIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );

  const CheckIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="w-full">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="w-full bg-[#2E0854] text-white py-2 px-4 rounded flex items-center justify-center"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Suggest Meeting Location
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-semibold text-center mb-3">
            Suggest Meeting Details
          </h3>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <InfoIcon className="h-4 w-4 text-blue-400" />
              </div>
              <div className="ml-2">
                <p className="text-xs text-blue-700">
                  Suggest a meeting time and place to coordinate the exchange.
                </p>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <Calendar className="w-4 h-4 text-[#2E0854] mr-1" />
              <label className="font-medium text-sm">Date</label>
            </div>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2E0854]"
              required
            />
          </div>

          {/* Time Picker */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <Clock className="w-4 h-4 text-[#2E0854] mr-1" />
              <label className="font-medium text-sm">Time</label>
            </div>
            <select
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2E0854]"
              required
            >
              <option value="">Select a time</option>
              {times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Map & Meeting Location Picker */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <MapPin className="w-4 h-4 text-[#2E0854] mr-1" />
              <label className="font-medium text-sm">Meeting Location</label>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <img
                  src={campusMap}
                  alt="SFSU Campus Map"
                  className="w-full rounded-lg"
                />
                {locations.map((location) => (
                  <div
                    key={location.name}
                    className="absolute group cursor-pointer flex flex-col items-center"
                    style={{
                      top: location.top,
                      left: location.left,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => handleLocationClick(location.name)}
                  >
                    <div className="px-2 py-0.5 mt-1 bg-white border text-xs text-black rounded shadow z-10 whitespace-nowrap">
                      {location.name}
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        meetingLocation === location.name
                          ? "bg-[#2E0854] ring-2 ring-white scale-125"
                          : "bg-red-600"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Marker Legend */}
              <div className="mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  <span>Available meeting point</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full bg-[#2E0854] ring-2 ring-white"></div>
                  <span>Selected location</span>
                </div>
              </div>
            </div>

            {/* Selected location display */}
            {meetingLocation && (
              <div className="mt-2 p-2 bg-[#FFCC00] bg-opacity-10 rounded-lg">
                <p className="font-medium text-sm flex items-center text-[#2E0854]">
                  <CheckIcon className="w-3 h-3 text-green-500 mr-1" />
                  Meeting at: <span className="ml-1">{meetingLocation}</span>
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsVisible(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendSuggestion}
              disabled={!meetingLocation || !meetingTime || !meetingDate}
              className="flex-1 bg-[#2E0854] text-white py-2 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Suggestion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingLocationMap;
