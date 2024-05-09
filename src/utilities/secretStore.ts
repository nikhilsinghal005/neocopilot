import {SecretStorage} from 'vscode';

export async function storeTokens(secrets: SecretStorage, extensionId: string, accessToken: string, refreshToken: string, idToken: string): Promise<void> {
  await secrets.store(`${extensionId}.accessToken`, accessToken);
  await secrets.store(`${extensionId}.refreshToken`, refreshToken);
  await secrets.store(`${extensionId}.idToken`, idToken);
  console.log("Tokens Are Stored")
}