import * as vscode from 'vscode';

export function handleActiveEditor(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    // Call this to get the current selected file name
    if (editor) {
      const currentSelectedFileName = editor.document.fileName;
    //   // console.log(`Current file name: ${currentSelectedFileName}`);
      return currentSelectedFileName;
    } else {
        return "";
    }
}

export function handleAllOpenEditors(context: vscode.ExtensionContext) {
    // Call this to get all open Editors in the split windows
    const editors = vscode.window.visibleTextEditors;
    const openFileNames = editors.map(editor => editor.document.fileName);
    // // console.log('All open files:', openFileNames);
    return openFileNames;
}

export function handleAllOpenFiles(context: vscode.ExtensionContext) {
    // Call this to get all open files in all the tabs
    const documents = vscode.workspace.textDocuments;
    const openFileNames = documents.map(document => document.fileName);
    // // console.log('All open files:', openFileNames);
    return openFileNames;
}
