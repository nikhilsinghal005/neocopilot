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


export function modifySuggestion(mainString: string, tempString: string, sliceLength: number): string {
  console.log(`mainString: ${mainString}`);
  console.log(`tempString: ${tempString}`);
  console.log(`sliceLength: ${sliceLength}`);
  if (mainString.endsWith(tempString) && mainString!=tempString) {
      const endIndex = mainString.length - tempString.length;
      const modifiedMainSuggestion = mainString.slice(0, endIndex);
      console.log(`endIndex: ${endIndex}`);
      console.log(`modifiedMainSuggestion: ${modifiedMainSuggestion}`);

      if (sliceLength > 0 && sliceLength <= modifiedMainSuggestion.length) {
          const slice = modifiedMainSuggestion.slice(-sliceLength);  // get slice from the end
          // console.log(`slice: ${slice}`);
          console.log(`slice: ${slice}`);

          return slice + tempString;  // prepend slice to tempSuggestion
      }else{
          return "";
      }
  }else{
    return "";
  }
  // return "";  // return tempSuggestion unchanged if there's no match or invalid sliceLength
}

// if(this.socketModule.systemChangeInProgress){
//   console.log("System Change in Progress No Action Required");
// }else{
//   console.log("System Change in Progress");
//   this.textPredictionHandeling(
//     vscode.window.activeTextEditor, this.textAfterCursor, this.textBeforeCursor,
//     tempSuggestion, event
//   );
// };

// const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;