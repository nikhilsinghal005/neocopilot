import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { showTextNotification } from '../../utilities/statusBarNotifications/showTextNotification';
import { showErrorNotification } from '../../utilities/statusBarNotifications/showErrorNotification';


export async function createFile(relativePath: string): Promise<boolean> {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return false;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const absolutePath = path.join(workspaceFolder, relativePath);

    try {
        // Create the necessary directories if they don't exist
        await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });

        // Create the file
        await fs.promises.writeFile(absolutePath, '', { flag: 'wx' }); // wx flag ensures the file is created exclusively

        // Open the newly created file in the editor
        const newFileUri = vscode.Uri.file(absolutePath);
        await vscode.window.showTextDocument(newFileUri);

        showTextNotification(`File created successfully at ${relativePath}`, 2);
        return true;

    } catch (error: any) {
        if (error.code === 'EEXIST') {
            showErrorNotification(`File already exists at ${relativePath}`, 2);
        } else {
            showErrorNotification(`Error creating file: ${error.message}`, 2);
            // console.error("Error creating file:", error); // Log for debugging
        }
        return false;
    }
}

