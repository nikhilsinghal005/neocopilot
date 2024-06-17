import * as vscode from 'vscode';

const isLoggedInKey = 'isLoggedIn';

/**
 * Retrieves the login status from the secret storage.
 * 
 * @param context The extension context provided by the activate function.
 * @returns A promise that resolves to the login status (true/false).
 */
export async function getIsLoggedIn(context: vscode.ExtensionContext): Promise<boolean> {
    try {
        const secretValue = await context.secrets.get(isLoggedInKey);
        if (secretValue === undefined) {
            // console.log(`No login status found.`);
            return false;
        }
        // console.log(`Retrieved login status.`);
        return secretValue === 'true';
    } catch (error) {
        console.error('Error fetching login status:', error);
        return false;
    }
}

/**
 * Stores the login status in the secret storage.
 * 
 * @param context The extension context provided by the activate function.
 * @param value The login status to store (true/false).
 * @returns A promise that resolves when the login status is stored.
 */
export async function setIsLoggedIn(secrets: vscode.SecretStorage, value: boolean): Promise<void> {
    try {
        await secrets.store(isLoggedInKey, value.toString());
        // console.log("Login Status Updated");
    } catch (error) {
        console.error('Error updating login status:', error);
    }
}