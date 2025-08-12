import * as vscode from 'vscode';
import { Logger } from '../../../core/logging/Logger';

/**
 * Interface for editor context information
 */
export interface EditorContext {
  fileName?: string;
  languageId?: string;
  hasSelection: boolean;
  selectedText?: string;
  selectedTextLength: number;
  cursorLine?: number;
  cursorCharacter?: number;
  totalLines?: number;
  totalCharacters?: number;
  selectionRange?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  message?: string;
}

/**
 * Service for gathering editor context information
 */
export class EditorContextService {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Get comprehensive editor context from the active editor
   */
  public getEditorContext(activeEditor?: vscode.TextEditor): EditorContext {
    if (!activeEditor) {
      return { 
        message: 'No active editor found',
        hasSelection: false,
        selectedTextLength: 0
      };
    }

    const selectedText = activeEditor.document.getText(activeEditor.selection);
    const fileName = activeEditor.document.fileName;
    const languageId = activeEditor.document.languageId;
    const cursorPosition = activeEditor.selection.active;
    const fullText = activeEditor.document.getText();
    const lineCount = activeEditor.document.lineCount;

    const context: EditorContext = {
      fileName,
      languageId,
      hasSelection: !activeEditor.selection.isEmpty,
      selectedText: selectedText.trim() || undefined,
      selectedTextLength: selectedText.length,
      cursorLine: cursorPosition.line,
      cursorCharacter: cursorPosition.character,
      totalLines: lineCount,
      totalCharacters: fullText.length
    };

    // Add selection range if text is selected
    if (selectedText.trim()) {
      context.selectionRange = {
        start: {
          line: activeEditor.selection.start.line,
          character: activeEditor.selection.start.character
        },
        end: {
          line: activeEditor.selection.end.line,
          character: activeEditor.selection.end.character
        }
      };

      // Log selected code details
      this.logger.info('Selected Code Details:', {
        text: selectedText,
        startLine: activeEditor.selection.start.line,
        endLine: activeEditor.selection.end.line,
        selectionRange: context.selectionRange
      });
    }

    return context;
  }

  /**
   * Get the currently active editor
   */
  public getActiveEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  /**
   * Check if there is selected text in the active editor
   */
  public hasSelectedText(): boolean {
    const editor = this.getActiveEditor();
    return editor ? !editor.selection.isEmpty : false;
  }

  /**
   * Get only the selected text without full context
   */
  public getSelectedText(): string | undefined {
    const editor = this.getActiveEditor();
    if (!editor || editor.selection.isEmpty) {
      return undefined;
    }
    return editor.document.getText(editor.selection);
  }
}
