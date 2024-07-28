import * as vscode from 'vscode';

export class CommentDetection {
  public static isCommentAction(event: vscode.TextDocumentChangeEvent, editor: vscode.TextEditor): boolean {
    const changes = event.contentChanges;
    if (changes.length === 0) {
      return false;
    }

    const document = editor.document;
    const language = document.languageId;

    for (const change of changes) {
        // console.log('Change details:', JSON.stringify(event, null, 2));
        const changeText = change.text;
        const range = new vscode.Range(change.range.start, change.range.end);

        // Capture the text before and after the change
        const beforeText = document.getText(range);
        const afterText = changeText;

        // Skip processing if the change text is empty (e.g., undo, remove comment)
        if (afterText === '') {
            return false;
        }       

        // Check for adding or removing line comments
        if (this.isLineCommentToggle(beforeText, afterText, language)) {
            return true;
        }

        // Check for adding or removing block comments
        // if (this.isBlockCommentToggle(beforeText, afterText, language)) {
        //     return true;
        // }
    }

    return false;
  }

  private static isLineCommentToggle(beforeText: string, afterText: string, language: string): boolean {
    const lineCommentStart = this.getLineCommentStart(language);
    return (
      (afterText.trim() === lineCommentStart && !beforeText.trim().startsWith(lineCommentStart)) ||
      (afterText.trim() === '' && beforeText.trim().startsWith(lineCommentStart))
    );
  }


  private static getLineCommentStart(language: string): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'java':
      case 'c':
      case 'cpp':
        return '//';
      case 'python':
        return '#';
      default:
        return '//';
    }
  }

