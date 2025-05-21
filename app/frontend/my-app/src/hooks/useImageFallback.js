// useImageFallback.js
import { useEffect } from 'react';

/**
 * Custom hook to set a global image fallback
 * This prevents 404 errors when images fail to load
 */
function useImageFallback() {
  useEffect(() => {
    // Base64 encoded SVG placeholder image
    const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
    
    // Override the global Image.prototype.onerror
    const originalOnError = Image.prototype.onerror;
    
    Image.prototype.onerror = function() {
      // Stop trying additional fallbacks to prevent infinite loops
      this.onerror = null;
      
      // Set the fallback image
      this.src = fallbackImage;
      
      // Call the original handler if it exists
      if (originalOnError) {
        originalOnError.call(this);
      }
    };
    
    // Cleanup function - restore original behavior when component unmounts
    return () => {
      Image.prototype.onerror = originalOnError;
    };
  }, []);
}

export default useImageFallback;