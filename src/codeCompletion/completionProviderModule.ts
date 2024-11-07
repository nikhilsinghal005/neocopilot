import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';

export class CompletionProviderModule implements vscode.InlineCompletionItemProvider {
    public suggestion: string;
    
    constructor() {
      this.suggestion = '';
    };

    public updateSuggestion(suggestion: string) {
      // // // console.log(`Received suggestion: ${suggestion}`);
      if(suggestion){
        this.suggestion = suggestion;
        this.triggerInlineSuggestion() 
      }else{
        this.suggestion = suggestion;
        vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
      }
    }

    public async provideInlineCompletionItems (document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken) {
      if (this.suggestion !== undefined && this.suggestion!=="") {
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
            // // console.log("Suggestion Triggered")
          } else {
            // // console.log('No active editor!');
          }
      }

  }