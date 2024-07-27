import * as vscode from 'vscode';
import { SocketModule } from './socketModule';

export class CompletionProviderModule implements vscode.InlineCompletionItemProvider {
    public suggestion: string;
    
    constructor() {
      this.suggestion = '';
    };

    public updateSuggestion(suggestion: string) {
      // Update the suggestion and trigger inline suggestion if there is a suggestion
      if(suggestion){
        this.suggestion = suggestion;
        this.triggerInlineSuggestion();
      } else {
        this.suggestion = suggestion;
        vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
      }
    }
    
    public async provideInlineCompletionItems(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        context: vscode.InlineCompletionContext, 
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
      // Check the trigger kind to determine how the inline completion was triggered
      if (context.triggerKind === 1) {
        // Auto-triggered by typing or other actions
        console.log('Inline completion auto-triggered');
      } else {
        // Explicitly triggered by user action
        console.log('Inline completion explicitly triggered');
      }
      // Check if there is selected completion info
      // if (context.selectedCompletionInfo) {
      //     const selectedInfo = context.selectedCompletionInfo;
      //     console.log('Selected completion info:', selectedInfo);
      //     // Use selectedInfo.range and selectedInfo.text as needed
      // }
      // Provide the inline completion item if a suggestion is available
      if (this.suggestion !== undefined && this.suggestion !== "") {
        const item = new vscode.InlineCompletionItem(this.suggestion, new vscode.Range(position, position));
        return [item];
      } else {
        return [];
      }
    }

    private triggerInlineSuggestion() {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
        console.log("Suggestion Triggered");
      } else {
        console.log('No active editor!');
      }
    }
}
