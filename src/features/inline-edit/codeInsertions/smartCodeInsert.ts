// src/codeInsertions/CodeInsertionManager.ts
import * as vscode from 'vscode';
import { showErrorNotification } from '../../../core/notifications/statusBarNotifications/showErrorNotification';

/**
 * Represents an insertion in the editor.
 */
interface Insertion {
  id: string;
  decorationType: vscode.TextEditorDecorationType;
  deletedDecorationType?: vscode.TextEditorDecorationType;
  sameDecorationType?: vscode.TextEditorDecorationType;
  insertedRanges: vscode.Range[];
  deletedRanges: vscode.Range[];
  sameRanges: vscode.Range[];
}

export class SmartInsertionManager {
  private static instance: SmartInsertionManager | null = null; // Singleton instance

  private insertions: Map<string, Insertion> = new Map();
  public oldLinesList: string[] = [];
  public oldStartLine: number = 0;
  public oldEndLine: number = 0;
  public uniqueId: string = '';
  public currentCodeBlockId: string = '';
  private edit = new vscode.WorkspaceEdit();
  public currentEditor: vscode.TextEditor | undefined;
  public leftOver: string = '';

  private insertedDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(92, 248, 1, 0.2)',
    isWholeLine: true
  });
  private deletedDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    isWholeLine: true
  });
  private sameDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 0, 255, 0)',
  });
  private movingDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(81, 81, 171, 0.358)',
    isWholeLine: true
  });

  private responseQueue: Array<{ updatedText: string, id: string, nextLineCharacter: string, isComplete: boolean }> = [];
  private isProcessing = false;
  public decorationsToApply = {
    deleted: [] as vscode.Range[],
    inserted: [] as vscode.Range[],
    same: [] as vscode.Range[]
  };

  constructor() {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && this.currentEditor) {
        if (editor.document.uri.toString() === this.currentEditor.document.uri.toString()) {
          this.reinitializeDecorations();
        }
      }
    });
  }

  public async reinitializeDecorations(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        console.log("Which Editor");
        this.currentEditor = vscode.window.activeTextEditor;
        this.currentEditor?.setDecorations(this.insertedDecorationType, this.decorationsToApply.inserted);
        this.currentEditor?.setDecorations(this.deletedDecorationType, this.decorationsToApply.deleted);
        this.currentEditor?.setDecorations(this.sameDecorationType, this.decorationsToApply.same);
    }
  }

  public reinitialize(): void {
    // Dispose of all existing decorations
    this.insertions.forEach((insertion) => {
        insertion.decorationType.dispose();
        if (insertion.deletedDecorationType) {
            insertion.deletedDecorationType.dispose();
        }
        if (insertion.sameDecorationType) {
            insertion.sameDecorationType.dispose();
        }
    });

    // Clear decorations in the editor
    const editor = this.currentEditor;
    if (editor) {
        editor.setDecorations(this.insertedDecorationType, []);
        editor.setDecorations(this.deletedDecorationType, []);
        editor.setDecorations(this.sameDecorationType, []);
    }

    // Reset insertion map
    this.insertions.clear();

    // Clear old lines list and reset old start and end line values
    this.oldLinesList = [];
    this.oldStartLine = 0;
    this.oldEndLine = 0;

    // Reinitialize the decoration types
    this.insertedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(92, 248, 1, 0.2)',
        isWholeLine: true,
    });
    this.deletedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        isWholeLine: true,
    });
    this.sameDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 0, 255, 0)',
    });

    // Clear decorations to apply
    this.decorationsToApply = {
        deleted: [],
        inserted: [],
        same: [],
    };
    this.currentEditor = undefined;
    this.leftOver = '';
}

  // Static method to get the singleton instance
  public static getInstance(): SmartInsertionManager {
    if (!SmartInsertionManager.instance) {
      SmartInsertionManager.instance = new SmartInsertionManager(); // Create a new instance if it doesn't exist
    }
    return SmartInsertionManager.instance; // Return the existing instance
  }

  /**
   * Accepts an insertion, keeping updated and same lines, and removing deleted lines.
   * @param id Unique identifier for the insertion.
   */
  public async acceptInsertion(): Promise<void> {
    const insertion = this.insertions.get(this.uniqueId);
    if (!insertion) {
      showErrorNotification('Insertion not found.');
      return;
    }

    if (!this.currentEditor) {
      showErrorNotification('No active editor found.');
      return;
    }

    if (vscode.window.activeTextEditor?.document.uri) {
        if (vscode.window.activeTextEditor.document.uri.toString() !== this.currentEditor.document.uri.toString()) {
          const document = await vscode.workspace.openTextDocument(this.currentEditor.document.uri);
          await vscode.window.showTextDocument(document);
          // add a sleep
          await new Promise(resolve => setTimeout(resolve, 300));
          this.currentEditor = vscode.window.activeTextEditor;
        }  
    }

    const success = await this.currentEditor.edit((editBuilder) => {
      // Delete ranges for deleted lines
      insertion.deletedRanges.forEach((range) => {
        const fullLineRange = new vscode.Range(
          range.start.line,
          0,
          range.start.line + 1,
          0 // Move to the start of the next line to capture the newline
        ); 
        editBuilder.delete(fullLineRange);
      });
    });

    if (success) {
      // Dispose of decorations
      insertion.decorationType.dispose();
      if (insertion.deletedDecorationType) {
        insertion.deletedDecorationType.dispose();
      }
      if (insertion.sameDecorationType) {
        insertion.sameDecorationType.dispose();
      }

      this.insertions.delete(this.uniqueId);
      this.currentEditor?.setDecorations(this.insertedDecorationType, []);
      this.currentEditor?.setDecorations(this.deletedDecorationType, []);
      this.currentEditor?.setDecorations(this.sameDecorationType, []);
      this.reinitialize();
    } else {
      this.reinitialize();
      showErrorNotification('Failed to accept the insertion.');
    }
  }
/**
 * Rejects an insertion, keeping only the same lines and removing updated and deleted lines.
 * @param id Unique identifier for the insertion.
 */
public async rejectInsertion(): Promise<void> {
  const insertion = this.insertions.get(this.uniqueId);
  if (!insertion) {
    showErrorNotification('Insertion not found.');
    return;
  }

  if (!this.currentEditor) {
    showErrorNotification('No active editor found.');
    return;
  }

  if (vscode.window.activeTextEditor?.document.uri) {
    if (vscode.window.activeTextEditor.document.uri.toString() !== this.currentEditor.document.uri.toString()) {
      const document = await vscode.workspace.openTextDocument(this.currentEditor.document.uri);
      await vscode.window.showTextDocument(document);
      // add a sleep
      await new Promise(resolve => setTimeout(resolve, 300));
      this.currentEditor = vscode.window.activeTextEditor;
    }  
}


this.currentEditor
    .edit((editBuilder) => {
      // Delete ranges for inserted and deleted lines
      insertion.insertedRanges.forEach((range) => {
        const fullLineRange = new vscode.Range(
          range.start.line,
          0,
          range.start.line + 1,
          0 // Move to the start of the next line to capture the newline
        ); 
        editBuilder.delete(fullLineRange);
      });
    })
    .then((success) => {
      if (success) {
        // Dispose of all decorations
        if (insertion.decorationType) {
          insertion.decorationType.dispose();
        }
        if (insertion.deletedDecorationType) {
          insertion.deletedDecorationType.dispose();
        }
        if (insertion.sameDecorationType) {
          insertion.sameDecorationType.dispose();
        }

        this.insertions.delete(this.uniqueId);
        this.currentEditor?.setDecorations(this.insertedDecorationType, []);
        this.currentEditor?.setDecorations(this.deletedDecorationType, []);
        this.currentEditor?.setDecorations(this.sameDecorationType, []);
        this.reinitialize();
      } else {
        this.reinitialize();
        showErrorNotification('Failed to reject the insertion.');
      }
    });
}

public async enqueueSnippetLineByLine(
    updatedText: string,
    id: string,
    nextLineCharacter: string,
    isComplete: boolean = false
): Promise<void> {
    // Add the response to the queue
    this.responseQueue.push({ updatedText, id, nextLineCharacter, isComplete });

    // Start processing if not already processing
    if (!this.isProcessing) {
        this.processQueue();
    }
}

  private async processQueue(): Promise<void> {
      this.isProcessing = true;

      while (this.responseQueue.length > 0) {
          const { updatedText, id, nextLineCharacter, isComplete } = this.responseQueue.shift()!;

          // Call your existing insert function
          await this.insertSnippetLineByLineInternal(updatedText, id, nextLineCharacter, isComplete);
      }

      this.isProcessing = false;
  }

  /**
   * Inserts a snippet at the specified selection and highlights the deleted and inserted text.
   * @param updatedText The text to be inserted.
   * @param id Unique identifier for the insertion.
   */
  public async insertSnippetLineByLineInternal(
      updatedText: string,
      id: string,
      nextLineCharacter: string,
      isComplete: boolean = false
  ): Promise<void> {

      const editor = this.currentEditor;
      if (!editor) {
          showErrorNotification('No active editor or valid selection context found.');
          return;
      }

      if (isComplete) {
        let updatedIndex = 0;
        if (this.oldLinesList.length > 0) {
          for (const _newLine of this.oldLinesList) {
            const startPos = new vscode.Position(this.oldStartLine + updatedIndex, 0);
            const endPos = new vscode.Position(this.oldStartLine + updatedIndex, 1000);
            const lineRange = new vscode.Range(startPos, endPos);
            editor.setDecorations(this.movingDecorationType, [lineRange]);
            this.decorationsToApply.deleted.push(lineRange);
            updatedIndex++;
          }
          editor.setDecorations(this.insertedDecorationType, this.decorationsToApply.inserted);
          editor.setDecorations(this.deletedDecorationType, this.decorationsToApply.deleted);
          editor.setDecorations(this.sameDecorationType, this.decorationsToApply.same);
        }

        const insertion: Insertion = {
          id,
          decorationType: this.insertedDecorationType,
          deletedDecorationType: this.deletedDecorationType,
          sameDecorationType: this.sameDecorationType,
          insertedRanges: this.decorationsToApply.inserted,
          deletedRanges: this.decorationsToApply.deleted,
          sameRanges: this.decorationsToApply.same,
        };

        editor.setDecorations(this.movingDecorationType, []);
        this.insertions.set(id, insertion);
        console.log("Insertion Process Completed");
        return;
      }

      updatedText = this.leftOver + updatedText;
      // console.log("------------------------------------------------", JSON.stringify(updatedText))
      // console.log("------------------------------------------------", JSON.stringify(this.oldLinesList))
      if (updatedText.length === 0){
        return;
      }
      // console.log("------------------------------------------------", JSON.stringify(updatedText))
      // add a sleep time to simulate the delay
      // await new Promise((resolve) => setTimeout(resolve, 5000));
      // count of occurances
      let newLineList = updatedText.split(nextLineCharacter);
      newLineList = newLineList.filter(line => !line.includes("```"));

      if (newLineList.length > 1) {
        this.leftOver = newLineList.pop() || "";
      }
      // console.log("#######", newLineList)

      // Required Input Variables
      for (const newLine of newLineList) {
        // console.log("===============================================")
        // console.log("***************", JSON.stringify(newLine))
        let updatedIndex = 0;
  
        // Index of newLine in oldText
        const index = this.oldLinesList.indexOf(newLine);
        // console.log("***************", JSON.stringify(index))

        if (index === -1) {
          // Getting Updated Positions
          const startPos = new vscode.Position(this.oldStartLine + updatedIndex, 0);
          const endPos = new vscode.Position(this.oldStartLine + updatedIndex, 1000);
          const lineRange = new vscode.Range(startPos, endPos);
          editor.setDecorations(this.movingDecorationType, [lineRange]);

          // Inserting newLine into Editor
          const edit = new vscode.WorkspaceEdit();
          edit.insert(editor.document.uri, startPos, newLine + nextLineCharacter);
          const _success = await vscode.workspace.applyEdit(edit);
          // Applying Decorations
          this.decorationsToApply.inserted.push(lineRange);

          // Updating Finalize Variables
          updatedIndex += 1;
          this.oldStartLine = this.oldStartLine + updatedIndex;
          this.oldEndLine = this.oldEndLine + updatedIndex;
          // console.log("***************", JSON.stringify(lineRange), JSON.stringify(newLine))

        } else {
          const slicedLines = this.oldLinesList.slice(0, index + 1);
          // console.log("***************", JSON.stringify(this.oldLinesList))

          for (const _tempLine in slicedLines) {
            const startPos = new vscode.Position(this.oldStartLine + updatedIndex, 0);
            const endPos = new vscode.Position(this.oldStartLine + updatedIndex, 1000);
            const lineRange = new vscode.Range(startPos, endPos);
            editor.setDecorations(this.movingDecorationType, [lineRange]);

            if (slicedLines[_tempLine] === newLine){
              this.decorationsToApply.same.push(lineRange);
            } else {
              this.decorationsToApply.deleted.push(lineRange);
            }
            updatedIndex += 1;
            // console.log("***************", JSON.stringify(lineRange), JSON.stringify(tempLine))
          }
          this.oldStartLine = this.oldStartLine + updatedIndex;
          this.oldEndLine = this.oldEndLine + updatedIndex;
          this.oldLinesList = this.oldLinesList.slice(index + 1);
        }
        // console.log("***************", JSON.stringify(this.oldLinesList))
        // console.log("***************", JSON.stringify(this.oldStartLine))

        // Apply decorations
        editor.setDecorations(this.insertedDecorationType, this.decorationsToApply.inserted);
        editor.setDecorations(this.deletedDecorationType, this.decorationsToApply.deleted);
        editor.setDecorations(this.sameDecorationType, this.decorationsToApply.same);
      }
  }
}