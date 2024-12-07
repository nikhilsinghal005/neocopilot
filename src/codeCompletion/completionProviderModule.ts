// src/codeCompletion/completionProviderModule.ts

import * as vscode from 'vscode';
import { debounce } from 'lodash';

export class CompletionProviderModule implements vscode.InlineCompletionItemProvider {

    private static instance: CompletionProviderModule;
    public suggestion: string = '';
    private previousSuggestion: string = '';

    // Debounced function to trigger inline suggestions
    private debouncedTriggerInlineSuggestion: () => void;

    private constructor() {
        // Initialize the debounced function with a 100ms delay
        this.debouncedTriggerInlineSuggestion = debounce(this.triggerInlineSuggestion.bind(this), 100);
    }

    public static getInstance(): CompletionProviderModule {
        if (!CompletionProviderModule.instance) {
            CompletionProviderModule.instance = new CompletionProviderModule();
        }
        return CompletionProviderModule.instance;
    }

    /**
     * Update the current suggestion and trigger inline suggestions if necessary.
     * @param suggestion The new suggestion to display.
     */
    public updateSuggestion(suggestion: string) {
        if (this.suggestion === suggestion) {
            // No change in suggestion; do nothing to prevent unnecessary updates
            return;
        }

        this.suggestion = suggestion;

        if (suggestion) {
            this.debouncedTriggerInlineSuggestion();
        } else {
            this.clearSuggestion();
        }
    }

    /**
     * Clear the current suggestion and hide inline suggestions.
     */
    private clearSuggestion() {
        this.suggestion = '';
        vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
    }

    /**
     * Provide inline completion items based on the current suggestion.
     */
    public async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | undefined> {
        if (this.suggestion) {
            const range = new vscode.Range(position, position);
            const item = new vscode.InlineCompletionItem(this.suggestion, range);
            return [item];
        }
        return [];
    }

    /**
     * Trigger the inline suggestion in the editor.
     */
    private triggerInlineSuggestion() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // Only trigger if the suggestion is different from the previous one
            if (this.previousSuggestion !== this.suggestion) {
                vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
                this.previousSuggestion = this.suggestion;
            }
        }
    }
}
