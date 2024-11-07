// ----------------------- Development Environment -----------------------
export const API_BASE_URL = "https://apidev.neocopilot.io"; 
export const SOCKET_API_BASE_URL = "wss://apidev.neocopilot.io/websocket/v1/gen-ai-premium";
export const LOGIN_REDIRECT_URL = "https://dev.neocopilot.io/login";

// ----------------------- Production Environment -----------------------
// export const API_BASE_URL = "https://api.neocopilot.io";
// export const SOCKET_API_BASE_URL = "wss://api.neocopilot.io/websocket/v1/gen-ai-premium";
// export const LOGIN_REDIRECT_URL = "https://www.neocopilot.io/login";

// ----------------------- Local Environment -----------------------
// export const API_BASE_URL = "http://localhost:5000";
// export const SOCKET_API_BASE_URL = "ws://localhost:5000/websocket/v1/gen-ai-premium";
// export const LOGIN_REDIRECT_URL = "http://localhost:3000/login";

// ----------------------- Common Authentication URLs -----------------------
export const VERIFICATION_URL = "auth/verify-token";
export const USER_PROFILE_URL = "auth/fetch-profile";
export const TOKEN_REFRESH_URL = "auth/token-refresh";

// Combine base URL with endpoints
export const FULL_VERIFICATION_URL = `${API_BASE_URL}/${VERIFICATION_URL}`;
export const FULL_USER_PROFILE_URL = `${API_BASE_URL}/${USER_PROFILE_URL}`;
export const FULL_TOKEN_REFRESH_URL = `${API_BASE_URL}/${TOKEN_REFRESH_URL}`;