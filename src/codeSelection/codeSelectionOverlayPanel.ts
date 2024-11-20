import * as vscode from 'vscode';
import { AiChatPanel } from '../chatProvider/aiChatPanel';
import { SocketModule } from '../socketModule';
import { SelectionContext } from './selectionContext';

export class FloatingHoverProvider implements vscode.HoverProvider {
    private debounceTimeout: NodeJS.Timeout | null = null;
    private aiChatpanel: AiChatPanel;
    private socketModule: SocketModule;
    private decorationTimeout: NodeJS.Timeout | null = null;
    private selectionContext: SelectionContext;

    constructor(aiChatpanel: AiChatPanel, socketModule: SocketModule, selectionContext: SelectionContext) {
        this.aiChatpanel = aiChatpanel;
        this.socketModule = socketModule;
        this.selectionContext = selectionContext;

        // Listen for cursor position changes
        vscode.window.onDidChangeTextEditorSelection((e) => this.onCursorPositionChanged(e));
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
            return undefined;
        }

        // Clear the debounce timeout if a new request comes in
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Only update hover if the position has changed
        if (this.selectionContext.lastHoverPosition && this.selectionContext.lastHoverPosition.isEqual(position)) {
            return undefined;
        }

        return new Promise<vscode.Hover | undefined>((resolve) => {
            const config = vscode.workspace.getConfiguration('editor.hover');
            this.debounceTimeout = setTimeout(() => {
                this.selectionContext.lastHoverPosition = position;

                // Find the selection containing the hover position
                for (const selection of editor.selections) {
                    // Expand the selection range by 3 lines above and below
                    this.selectionContext.exetndedRange = this.expandRange(selection, document);

                    if (!this.selectionContext.exetndedRange.contains(position)) {
                        continue;
                    }

                    const selectedText = document.getText(selection);

                    // Return cached hover if available
                    if (this.selectionContext.hoverCache.has(selectedText)) {
                        resolve(this.selectionContext.hoverCache.get(selectedText));
                        return;
                    }

                    // Create the hover
                    editor.setDecorations(this.selectionContext.decorationType, []);

                    const hover = this.selectionContext.createFixedHover(
                        this.selectionContext.exetndedRange, 
                        selectedText
                    );
                    if (hover) {
                        this.selectionContext.hoverCache.set(selectedText, hover);
                        this.selectionContext.lastSelection = selection;
                        resolve(hover);
                    }
                    return;
                }
                resolve(undefined); // No valid hover found
            }, 100); // 1-second delay
        });
    }

    private expandRange(selection: vscode.Selection, document: vscode.TextDocument): vscode.Range {
        // Calculate the expanded range
        const startLine = Math.max(0, selection.start.line);
        const endLine = Math.min(document.lineCount - 1, selection.end.line);

        // Extend to infinity on the same line
        const startChar = 0;
        const endChar = Number.MAX_SAFE_INTEGER;

        return new vscode.Range(
            new vscode.Position(startLine, startChar),
            new vscode.Position(endLine, endChar)
        );
    }

    private addDecoration(editor: vscode.TextEditor, position: vscode.Position) {
        // Clear any existing timeout to prevent overlapping timers
        if (this.decorationTimeout) {
            clearTimeout(this.decorationTimeout);
        }

        // Add a delay before showing the decoration
        this.decorationTimeout = setTimeout(() => {
            const line = editor.document.lineAt(position.line);
            if (line.isEmptyOrWhitespace && this.socketModule.suggestion === "" && !this.socketModule.predictionRequestInProgress) {
                const range = new vscode.Range(line.range.start, line.range.start);
                editor.setDecorations(this.selectionContext.decorationType, [range]);
            }
        }, 2500); // 1.5-second delay before showing the decoration
    }

    private clearDecorations(editor: vscode.TextEditor) {
        // Remove decorations immediately without any delay
        if (this.decorationTimeout) {
            clearTimeout(this.decorationTimeout);
        }
        editor.setDecorations(this.selectionContext.decorationType, []);
    }

    private onCursorPositionChanged(e: vscode.TextEditorSelectionChangeEvent) {
        const editor = e.textEditor;
        const position = editor.selection.active;

        // Clear previous decorations immediately
        this.clearDecorations(editor);

        if (position.character === 0) {
            const line = editor.document.lineAt(position.line);
            if (line.isEmptyOrWhitespace && this.socketModule.suggestion === "" && !this.socketModule.predictionRequestInProgress) {
                // Add decoration if the cursor is at the beginning of an empty line
                this.addDecoration(editor, position);
            }
        }
    }
}
