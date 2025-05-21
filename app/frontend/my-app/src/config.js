const config = {
    // API URL based on current environment
    apiUrl: window.location.hostname === 'localhost' 
      ? 'http://localhost:8001'  // Development
      : 'https://csc648g1.me/api', // Production
  };
  
  export default config;
