import * as vscode from 'vscode';
import { showErrorNotification } from '../../utilities/statusBarNotifications/showErrorNotification';

export async function openAndHighlightFile(relativePath: string): Promise<boolean> {
    try {
        // Resolve the relative path to an absolute file URI
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            showErrorNotification('No workspace folder found.', 2);
            return false;
        }

        // Use the first workspace folder as the base
        const workspaceFolder = workspaceFolders[0].uri.fsPath;
        const absolutePath = vscode.Uri.file(`${workspaceFolder}/${relativePath}`);

        // Check if the file is already open and active
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.fsPath === absolutePath.fsPath) {
            // vscode.window.showInformationMessage(`File is already active: ${relativePath}`);
            return true;
        }

        // Open the file in the editor
        const document = await vscode.workspace.openTextDocument(absolutePath);
        const editor = await vscode.window.showTextDocument(document);

        // Highlight the first line as an example (optional; can be removed or customized)
        const startPos = new vscode.Position(0, 0);
        const endPos = new vscode.Position(0, document.lineAt(0).text.length);
        const range = new vscode.Range(startPos, endPos);

        editor.selection = new vscode.Selection(startPos, endPos);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

        // vscode.window.showInformationMessage(`Opened and highlighted: ${relativePath}`);
        return true;
    } catch (error) {
        return false;
    }
}
