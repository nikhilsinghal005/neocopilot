import * as vscode from 'vscode';
import * as path from 'path';

export function getOpenFilesList(): Array<{
    fileName: string;
    filePath: string;
    languageId: string | null;
    isActive: boolean;
    isOpened: boolean;
    isSelected: boolean;
}> {
    const openFiles = vscode.window.tabGroups.all
        .flatMap(group => group.tabs)
        .filter(tab => tab.input instanceof vscode.TabInputText)
        .map(tab => {
            const documentUri = (tab.input as vscode.TabInputText).uri;
            const textDocument = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === documentUri.toString());

            return {
                fileName: path.basename(documentUri.fsPath),
                filePath: vscode.workspace.asRelativePath(documentUri.fsPath),
                languageId: textDocument ? textDocument.languageId : null,
                isActive: tab.isActive,
                isOpened: true,
                isSelected: false
            };
        });

    return openFiles;
}
