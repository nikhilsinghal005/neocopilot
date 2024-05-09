import * as vscode from 'vscode';

const isLoggedInKey = 'isLoggedIn';

export async function getIsLoggedIn(): Promise<boolean> {
    try {
        return !!vscode.workspace.getConfiguration().get(isLoggedInKey);
    } catch (error) {
        console.error('Error fetching login status:', error);
        return false;
    }
}

export async function setIsLoggedIn(value: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration().update(isLoggedInKey, value, vscode.ConfigurationTarget.Global);
        console.log("Login Status Updated");
    } catch (error) {
        console.error('Error updating login status:', error);
    }
}
