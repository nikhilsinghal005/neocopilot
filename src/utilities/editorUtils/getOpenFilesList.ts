import * as vscode from 'vscode'; // Ensure vscode is imported
import * as path from 'path'; // Ensure path is imported

export function getOpenFilesList(): Array<{ 
    fileName: string;
    filePath: string; // This will now be relative
    languageId: string | null;
}> {
    const openFiles = vscode.window.tabGroups.all
        .flatMap(group => group.tabs)
        .filter(tab => tab.input && tab.input instanceof vscode.TabInputText) // Ensure it's a file tab
        .map(tab => {
            const document = (tab.input as vscode.TabInputText).uri;
            const textDocument = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === document.toString());

            return {
                fileName: path.basename(document.fsPath),
                filePath: vscode.workspace.asRelativePath(document.fsPath),
                languageId: textDocument ? textDocument.languageId : null // Retrieve languageId if available
            };
        });

    return openFiles;
  }
