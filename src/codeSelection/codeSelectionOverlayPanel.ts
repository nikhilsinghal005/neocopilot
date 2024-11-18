import * as vscode from 'vscode';
import { AiChatPanel } from '../chatProvider/aiChatPanel';
import { SocketModule } from '../socketModule';
import { CodeSelectionCommand } from './selectionContext';
import { SelectionContext } from './selectionContext';

export class FloatingHoverProvider implements vscode.HoverProvider {
    private debounceTimeout: NodeJS.Timeout | null = null;
    private lastSelection: vscode.Selection | null = null;
    private aiChatpanel: AiChatPanel;
    private socketModule: SocketModule;
    private decorationTimeout: NodeJS.Timeout | null = null;
    private selectionContext: SelectionContext;

    // Constructor
    constructor(aiChatpanel: AiChatPanel, socketModule: SocketModule, selectionContext: SelectionContext) {
        this.aiChatpanel = aiChatpanel;
        this.socketModule = socketModule;
        this.selectionContext = selectionContext;

        // Define the decoration type
        this.selectionContext.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: 'NEO: Ctrl+O for chat and Ctrl+I for Inline Edit',
                color: new vscode.ThemeColor('editorLineNumber.foreground'),
                margin: '0 0 0 0',
            },
        });

        // Listen for cursor position changes
        vscode.window.onDidChangeTextEditorSelection((e) => this.onCursorPositionChanged(e));
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | undefined {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
            return undefined;
        }

        // Find the selection containing the hover position
        for (const selection of editor.selections) {
            if (selection.isEmpty || !selection.contains(position)) {
                continue;
            }

            const selectedText = document.getText(selection);

            // Return cached hover if available
            if (this.selectionContext.hoverCache.has(selectedText)) {
                return this.selectionContext.hoverCache.get(selectedText);
            }

            // Handle switching between selections with a delay
            const delay = this.lastSelection?.isEqual(selection) ? 0 : 2000;
            editor.setDecorations(this.selectionContext.decorationType, []);
            const hover = this.createFixedHover(selection, selectedText, delay);
            this.selectionContext.hoverCache.set(selectedText, hover);

            // Update last selection
            this.lastSelection = selection;
            return hover;
        }

        return undefined;
    }

    private createFixedHover(
        selection: vscode.Selection,
        selectedText: string,
        delay: number
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();

        // Add command buttons
        markdownContent.appendMarkdown(
            `[Insert in Chat](command:${CodeSelectionCommand.CHAT_INSERT} "Talk to Code") | ` +
            `[Edit](command:${CodeSelectionCommand.CODE_FACTOR} "Edit Code")`
        );
        markdownContent.isTrusted = true;

        // Add delay if necessary
        if (delay > 0) {
            setTimeout(() => { }, delay);
        }

        return new vscode.Hover(markdownContent, selection);
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
