import * as vscode from 'vscode';
import { FULL_VERIFICATION_URL, FULL_TOKEN_REFRESH_URL, FULL_USER_PROFILE_URL } from '../config';

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  userId: string
}

export class AuthManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  // Store the access token securely
  public async storeAccessToken(token: string): Promise<void> {
    console.log("NeoCopilot: Stored a-controls locally")
    await this.context.secrets.store('accessToken', token);
  }

   // Store the refresh token securely
   public async storeRefreshToken(token: string): Promise<void> {
    console.log("NeoCopilot: Stored r-controls locally")
    await this.context.secrets.store('refreshToken', token);
  }

   // Store the refresh token securely
   public async storeTokenProvider(input: string): Promise<void> {
    await this.context.secrets.store('tokenProvider', input);
  }
 

  // Retrieve the access token
  public async getAccessToken(): Promise<string | undefined> {
    return await this.context.secrets.get('accessToken');
  }

  // Retrieve the refresh token
  public async getRefreshToken(): Promise<string | undefined> {
    return await this.context.secrets.get('refreshToken');
  }

  // Store the user profile securely
  public async storeUserProfile(userProfile: UserProfile): Promise<void> {
      const userInfo = JSON.stringify(userProfile);
      await this.context.secrets.store('userProfile', userInfo);
      console.log('Neo Copilot: User profile stored successfully.');
  }

  // Retrieve the user profile
  public async getUserProfile(): Promise<UserProfile | null> {
    try {
      const userProfileString = await this.context.secrets.get('userProfile');
      if (userProfileString) {
        return JSON.parse(userProfileString) as UserProfile;
      } else {
        console.error('Neo Copilot: User info not available');
        return null;
      }
    } catch (error) {
      console.error('Neo Copilot: Failed to retrieve user info', error);
      return null;
    }
  }

// Verify the access token by calling the API
public async verifyAccessToken(maxRetries: number = 3): Promise<boolean> {
  let retries = 0;
  let token = await this.getAccessToken();
  if (!token) {
    console.error('Neo Copilot: No access token found.');
    await this.clearTokens();
    return false;
  }

  while (retries < maxRetries) {
    try {
      let isValid = await this.checkTokenValidity(token);
      if (!isValid) {
        console.error('Neo Copilot: User verification failed');
        const newToken = await this.refreshAccessToken();
        
        // If new token is obtained, check its validity
        if (newToken) {
          isValid = await this.checkTokenValidity(newToken);
        }
      }

      // If token is still invalid after attempting refresh, no retries; clear tokens
      if (!isValid) {
        console.error('Neo Copilot: User verification failed');
        // await this.clearTokens();
        return false;
      }

      // If token is valid, return success
      // console.info('%cNeo Copilot: User verification successful', 'color: green;' );
      return true;

    } catch (error) {
      retries++;
      console.error('Neo Copilot: User verification failed');
      console.log(error, 'Neo Copilot: User verification failed');

      // Retry only for network issues or temporary failures
      if (retries >= maxRetries || !isTemporaryError(error)) {
        console.log("Unknwon Error", error)
        console.error('Neo Copilot: User verification failed');
        await this.clearTokens();
        return false;
      }

      // Wait before retrying
      await sleep(5000);
    }
  }

  return false;
  }

  // Refresh the access token by calling the backend API
  public async refreshAccessToken(retryCount: number = 10000): Promise<string | null> { // High retry count for refresh attempts
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        console.error('Neo Copilot: No refresh token found.');
        return null;
      }
  
      const response = await fetch(FULL_TOKEN_REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.access_token) {
        await this.storeAccessToken(data.access_token);
        console.log('Neo Copilot: Token refreshed successfully.');
        return data.access_token;
      } else {
        // Check for 401 or 403 status codes to trigger logout
        if (response.status === 401 || response.status === 403) {
          console.error('Neo Copilot: Unable to verify user');
          await this.clearTokens();
          return null; // Logout case, return null
        } else if (response.status === 500 || response.status >= 500) {
          // Retry on server errors
          console.warn('Neo Copilot: Unable to verify user, retrying...');
          await sleep(5000);
          return this.refreshAccessToken(retryCount - 1);
        } else {
          // For all other errors (non 401/403), retry but do not log out
          console.warn('Neo Copilot: Temporary issue, retrying...');
          await sleep(5000);
          return this.refreshAccessToken(retryCount - 1);
        }
      }
    } catch (error: any) {
      if (isTemporaryError(error) && retryCount > 0) {
        console.warn('Neo Copilot: Temporary network issue detected, retrying...');
        await sleep(5000); // Wait before retrying
        return this.refreshAccessToken(retryCount);
      }
  
      // Check if the error has a response property and a status code
      const status = error?.response?.status;
  
      // Log out only if the error is related to unauthorized or forbidden access (401 or 403)
      if (status === 401 || status === 403) {
        console.error('Neo Copilot: Unauthorized or forbidden, logging out.');
        await this.clearTokens();
        return null; // Only log out on 401 or 403
      } else {
        // For all other errors, just retry indefinitely without logging out
        console.error('Neo Copilot: Error during token refresh, retrying...');
        if (retryCount == 5 || retryCount == 10 || retryCount == 100) {
          // Show a Vscode Information message if the retry count is 10 or 100
          vscode.window.showInformationMessage('Temporary network issue detected, Please check you internet. retrying...');
        }
        await sleep(5000); // Retry after delay
        return this.refreshAccessToken(retryCount - 1);
      }
    }
  }  

  // Internal method to check token validity
  private async checkTokenValidity(token: string): Promise<boolean> {
    try {
      const response = await fetch(FULL_VERIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Neo Copilot: User verification failed');
        return false;
      }

      const data = await response.json();
      return data.isValid || false;
    } catch (error) {
      console.error('Neo Copilot: User verification failed');
      return false;
    }
  }

  // Fetch the user profile using the access token
  public async fetchUserProfile(): Promise<UserProfile | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        // vscode.window.showErrorMessage('Neo Copilot: Please log in.');
        return null;
      }

      const response = await fetch(FULL_USER_PROFILE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Neo Copilot: User info fetched successfully.',);
        return {
          email: data.email,
          name: data.name,
          picture: data.picture,
          userId: data.userId
        };
      } else {
        // console.error('Neo Copilot: Failed to fetch profile, response was:', response.statusText);
        // vscode.window.showErrorMessage(`Failed to fetch profile: ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('Neo Copilot: Error fetching user info');
      return null;
    }
  }

  // Clear the access and refresh tokens
  public async clearTokens(): Promise<void> {
    console.log('Neo Copilot: Clearing tokens')
    console.info("%cNeo Copilot: User logged out", 'color: green;')
    await this.context.secrets.store('accessToken', '');
    await this.context.secrets.store('refreshToken', '');
  }

  // Clear only the access token
  public async clearAccessToken(): Promise<void> {
    await this.context.secrets.store('accessToken', '');
  }

  // Clear only the access token
  public async clearUserProfile(): Promise<void> {
    await this.context.secrets.store('userProfile', '');
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isTemporaryError(error: any): boolean {
  if (error && (error.message.includes('NetworkError') || error.message.includes('timeout') || error.message.includes('ECONNRESET'))) {
    return true;
  }
  return false;
}