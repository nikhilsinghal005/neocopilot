import * as vscode from 'vscode';
import { Socket } from 'socket.io-client';
import { CompletionProviderModule } from '../codeCompletion/completionProviderModule';
import { showErrorNotification } from '../utilities/statusBarNotifications/showErrorNotification';
import { showTextNotification } from '../utilities/statusBarNotifications/showTextNotification';
import { AuthManager } from './authManager';
import { VscodeEventsModule } from '../codeCompletion/vscodeEventsModule';
import { SocketModule } from '../socketModule';
import { initializeAppFunctions } from '../initializeAppFunctions';

export interface UserProfile {
    email: string;
    name: string;
    pictureUrl: string;
    userId: string
}

export async function handleTokenUri(
    uri: vscode.Uri,
    context: vscode.ExtensionContext,
    vscodeEventsModule: VscodeEventsModule,
    completionProviderModule: CompletionProviderModule,
    socketModule: SocketModule,
    authManager: AuthManager,
): Promise<void> {
    if (uri.path === '/token') {
        const query = new URLSearchParams(uri.query);
        const accessToken: string | null = query.get('access_token');
        const refreshToken: string | null = query.get('refresh_token');

        if (accessToken && refreshToken) {
            try {
                await authManager.storeAccessToken(accessToken);
                await authManager.storeRefreshToken(refreshToken);
                const tokenIsVerified = await authManager.verifyAccessToken();
                // console.log("Token Verified - " , tokenIsVerified)

                if (tokenIsVerified) {
                    await authManager.storeTokenProvider('googleToken');
                    const userProfile = await authManager.fetchUserProfile();
                    // console.log("Token Stored Locally")

                    if (userProfile) {
                        await authManager.storeUserProfile(userProfile);
                        showTextNotification(`Login Successful: Happy Coding ${userProfile.name}`, 5);
                        const currentVersion = context.extension.packageJSON.version;
                        const socketConnection: Socket | null = await socketModule.connect(currentVersion, context);
                        initializeAppFunctions(vscodeEventsModule, completionProviderModule, authManager, socketModule, context);
                        

                    } else {
                        await authManager.clearTokens();
                        authManager.clearUserProfile();
                        showErrorNotification('Unable to login: Click on status bar to login again', 60);
                        console.error('NeoCopilot: User verification failed');

                    }
                } else {
                    await authManager.clearTokens();
                    authManager.clearUserProfile();
                    showErrorNotification('Unable to login: Click on status bar to login again', 60);

                }
            } catch (error) {
                console.error('NeoCopilot: Error in user verification');
                await authManager.clearTokens();
                authManager.clearUserProfile();
                showErrorNotification('Unable to login. Click on status bar to login again', 60);

            }
        } else {
            showErrorNotification('Unable to Login: Click on status bar to login again', 60);

        }
    }
}
