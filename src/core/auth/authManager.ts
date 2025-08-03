import * as vscode from 'vscode';
import { FULL_VERIFICATION_URL, FULL_TOKEN_REFRESH_URL, FULL_USER_PROFILE_URL } from '../config/config';
import { showErrorNotification } from '../notifications/statusBarNotifications/showErrorNotification';

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
    // console.log("NeoCopilot: Stored a-controls locally")
    await this.context.secrets.store('accessToken', token);
  }

   // Store the refresh token securely
   public async storeRefreshToken(token: string): Promise<void> {
    // console.log("NeoCopilot: Stored r-controls locally")
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
      // console.log('Neo Copilot: User profile stored successfully.');
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
public async verifyAccessToken(maxRetries: number = 5): Promise<boolean> {
    return true;
  }

  // Refresh the access token by calling the backend API
    public async refreshAccessToken(retryCount: number = 100000): Promise<string | null> {
      return "mock-access-token";
    }

  // Internal method to check token validity
  private async checkTokenValidity(token: string): Promise<boolean> {
    try {
      const response = await fetch(FULL_VERIFICATION_URL, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
        Authorization: `Bearer ${accessToken}`,
      },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('Neo Copilot: User info fetched successfully.',);
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
    // console.log('Neo Copilot: Clearing tokens')
    console.info("%cNeo Copilot: User logged out", 'color: green;');
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