// src/config.ts
export const API_BASE_URL = "https://api.neocopilot.io"; 
// export const API_BASE_URL = "http://localhost:5000";

// export const SOCKET_API_BASE_URL = "wss://api.neocopilot.io";
export const SOCKET_API_BASE_URL = "ws://localhost:5000";

// export const LOGIN_REDIRECT_URL = "http://localhost:3000";
export const LOGIN_REDIRECT_URL = "https://www.neocopilot.io";

export const VERIFICATION_URL = "verify-token";


// Combine base URL with endpoints
export const FULL_VERIFICATION_URL = `${API_BASE_URL}/${VERIFICATION_URL}`;