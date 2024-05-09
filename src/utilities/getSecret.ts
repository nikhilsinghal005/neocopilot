import * as vscode from 'vscode';

/**
 * Retrieves a stored secret from the VS Code Secret Storage.
 * 
 * @param context The extension context provided by the activate function.
 * @param key The key for the secret to retrieve.
 * @returns A promise that resolves to the secret value, or null if not found.
 */
export async function getSecret(context: vscode.ExtensionContext, key: string): Promise<string | undefined> {
    try {
        const secretValue = await context.secrets.get(key);
        if (secretValue === undefined) {
            console.log(`No secret found for key: ${key}`);
            return undefined;
        }
        console.log(`Retrieved secret for key: ${key}`);
        return secretValue;
    } catch (error) {
        console.error(`Error retrieving secret for key: ${key}`, error);
        return undefined;
    }
}
