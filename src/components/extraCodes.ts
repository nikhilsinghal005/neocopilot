// import * as vscode from 'vscode';

// export function handleActiveEditor(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
//     // Call this to get the current selected file name
//     if (editor) {
//       const currentSelectedFileName = editor.document.fileName;
//     //   console.log(`Current file name: ${currentSelectedFileName}`);
//       return currentSelectedFileName;
//     } else {
//         return "";
//     }
// }

// export function handleAllOpenEditors(context: vscode.ExtensionContext) {
//     // Call this to get all open Editors in the split windows
//     const editors = vscode.window.visibleTextEditors;
//     const openFileNames = editors.map(editor => editor.document.fileName);
//     // console.log('All open files:', openFileNames);
//     return openFileNames;
// }

// export function handleAllOpenFiles(context: vscode.ExtensionContext) {
//     // Call this to get all open files in all the tabs
//     const documents = vscode.workspace.textDocuments;
//     const openFileNames = documents.map(document => document.fileName);
//     // console.log('All open files:', openFileNames);
//     return openFileNames;
// }

    // console.log(`Text before cursor: ${event.contentChanges[0].text}`);
    // console.log(`Text before cursor: ${event.contentChanges[0].text.length}`);
    // // console.log(`Keys: ${Object.keys(event)}`);
    // console.log(`Keys: ${Object.keys(event.document)}`);
    // console.log(`Keys: ${event.document.languageId}`);
    // console.log(`Keys: ${event.document.version}`);
    // console.log(`Keys: ${event.document.lineCount}`);
    // console.log(`Keys: ${event.reason}`);
    // console.log(`Keys: ${Object.keys(event.contentChanges[0])}`);
    // console.log(`range: ${event.contentChanges[0].range}`);
    // console.log(`rangeOffset: ${event.contentChanges[0].rangeOffset}`);
    // console.log(`rangeLength: ${event.contentChanges[0].rangeLength}`);
    // console.log(`text: ${event.contentChanges[0].text}`);
    // const range = event.contentChanges[0].range;
    // console.log(`Start: ${range.start.line},${range.start.character}`);
    // console.log(`End: ${range.end.line},${range.end.character}`);

    // Check if document is of only one line
    // if (vscode.window.activeTextEditor?.document.lineCount === 1){
    //   console.log(`Document is of only one line`);
    //   return null;
    // }