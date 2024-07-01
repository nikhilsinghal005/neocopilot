import * as vscode from 'vscode';

export function getTextAfterCursor(editor: vscode.TextEditor | undefined): string {
    // Function to get text after the cursor
    if (editor) {
      const position = editor.selection.active;
      const range = new vscode.Range(position, new vscode.Position(editor.document.lineCount, 0));
      return editor.document.getText(range);
    }
    return "";
}

export function getTextBeforeCursor(editor: vscode.TextEditor | undefined): string {
    // Function to get text before the cursor
    if (editor) {
      const position = editor.selection.active;
      const range = new vscode.Range(new vscode.Position(0, 0), position);
      return editor.document.getText(range);
    }
    return "";
}

export function isNullOrEmptyOrWhitespace(inputString: string | null | undefined): boolean {
  return inputString === null || (inputString?.trim() === '');
}

export function checkFileNameForCodeCompletion(fileName: string | null | undefined): boolean {
  // List of programming language extensions for which code completion is supported
  const supportedExtensions = [
      '.js', '.ts', '.java', '.py', '.c', '.cpp', '.cs', '.rb', '.php', '.html', '.css'
  ];
  return supportedExtensions.some(extension => fileName?.endsWith(extension));
}

export function notSupportedFiles(fileName: string | null | undefined): boolean {
  // console.log("fileName", fileName)
  const commonIncludedFileList = ["requirements.txt", "package.json", "package-lock.json", "config.json", ".env"];
  if (fileName === undefined || fileName === null) {
    return true;
  }
  if (commonIncludedFileList.includes(fileName)) {
    // console.log("includes_file_name")
    return false;
  }
  const notSupportedExtensions = ['.csv', '.log', '.json', '.xml', '.md', '.txt', '.sql', '.html', '.xlsx', '.pdf'];
  return notSupportedExtensions.some(extension => fileName.endsWith(extension));
}


export function modifySuggestion(mainString: string, tempString: string, sliceLength: number): string {
  // Function to modify suggestion string
  // This function is used to modify the suggestion string to remove the part of the string
  // that is already typed by the user.
  // For example, if the user has typed "import" and the suggestion is "import os",
  // then the suggestion will be modified to "os".
  // This is done to avoid showing suggestions that are already typed by the user.
  // The sliceLength parameter is used to limit the length of the modified suggestion.
  // This is done to avoid showing suggestions that are too long.
  if (mainString.endsWith(tempString) && mainString!=tempString) {
      const endIndex = mainString.length - tempString.length;
      const modifiedMainSuggestion = mainString.slice(0, endIndex);
      if (sliceLength > 0 && sliceLength <= modifiedMainSuggestion.length) {
          const slice = modifiedMainSuggestion.slice(-sliceLength);
          return slice + tempString;
      }else{
          return "";
      }
  }else{
    return "";
  }
}

// if(this.socketModule.systemChangeInProgress){
//   // console.log("System Change in Progress No Action Required");
// }else{
//   // console.log("System Change in Progress");
//   this.textPredictionHandeling(
//     vscode.window.activeTextEditor, this.textAfterCursor, this.textBeforeCursor,
//     tempSuggestion, event
//   );
// };

// const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;