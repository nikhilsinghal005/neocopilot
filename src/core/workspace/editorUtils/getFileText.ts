import * as vscode from 'vscode'; // Ensure vscode is imported
import * as path from 'path'; // Ensure path is imported

export async function getFileText(relativePath: string): Promise<string | null> {
    try {
        // Check if any workspace is open
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace is open');
            return null;
        }
        
        // Use the first workspace folder to resolve the relative path
        const absolutePath = path.join(workspaceFolders[0].uri.fsPath, relativePath);

        // Create a URI for the file
        const fileUri = vscode.Uri.file(absolutePath);

        // Check if the path is a file
        let isFile = false;
        try {
            const fileStat = await vscode.workspace.fs.stat(fileUri);
            isFile = fileStat.type === vscode.FileType.File;
        } catch {
            isFile = false;
        }

        if (!isFile) {
            vscode.window.showErrorMessage('The path is not a file');
            return null;
        }

        // Open the text document
        const document = await vscode.workspace.openTextDocument(fileUri);

        // Return the text content
        return document.getText();
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading file: ${error}`); // Use error.message for clarity
        return null;
    }
}
