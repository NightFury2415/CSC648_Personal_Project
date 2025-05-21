import React from "react";

const AnnouncementBanner = () => {
  const semesterEndDate = new Date("2025-05-23");
  const commencementDate = new Date("2025-05-23");
  const today = new Date();

  const daysLeft = (date) => {
    const diffTime = date - today;
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  };

  const daysToEnd = daysLeft(semesterEndDate);
  const daysToCommencement = daysLeft(commencementDate);

  return (
    <div
      className="bg-yellow-300 text-[#2E0854] font-semibold shadow-md flex items-center justify-between px-4"
      style={{
        height: "64px", 
        marginBottom: "0px", 
      }}
    >
      <img
        src="/pictures/gator_web.png"
        alt="SFSU Logo"
        className="h-8 w-auto sm:h-10 md:h-12" 
      />
      <div className="text-center text-sm sm:text-base md:text-lg flex-grow">
        🎉 {daysToEnd} days left until the end of the semester! | 🎓{" "}
        {daysToCommencement} days left until Commencement!
      </div>
    </div>
  );
};

export default AnnouncementBanner;
