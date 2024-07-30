import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { CompletionProviderModule } from './completionProviderModule';
import { SOCKET_API_BASE_URL } from './config';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';
import { v4 as uuidv4 } from 'uuid';

export class SocketModule {
  public socket: Socket | null = null;
  // public socketMainSuggestion: string | undefined;
  public socketListSuggestion: string[];
  public suggestion: string;
  public completionProvider: CompletionProviderModule;
  public predictionRequestInProgress = false;
  public predictionWaitText = "";
  private tempUniqueIdentifier: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentVersion = versionConfig.getCurrentVersion();
  public currentSuggestionId: string = "";
  public rateLimitExceeded: Boolean = false;
  private rateLimitTimer: NodeJS.Timeout | null = null;
  private isUpdatePopupShown: Boolean = false;
  // private statusBarManager = StatusBarManager.getInstance();

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.suggestion = "";
    this.socketListSuggestion = [];
    this.tempUniqueIdentifier = "NA";
  }

  public connect(appVersion: string): Socket {
    if (this.socket) {
      return this.socket;
    }
    this.socket = io(SOCKET_API_BASE_URL, {
      query: { appVersion }
    });

    // Route to recieve message for for code completion
    this.socket.on('receive_message', (data: any) => {


      this.predictionRequestInProgress = false; // Setting up the prediction request is progress to false
      StatusBarManager.updateMessage(`Neo`); // Reseeting Status bar to Neo
      // console.log("Message List - ", JSON.stringify(data.message_list));

      // Matching the latest unique id with the current recived id.
      if (data.message && this.tempUniqueIdentifier === data.unique_Id) {
        this.currentSuggestionId = data.unique_Id; // This is will be used to send the completion message and tracking the completion

        // Update and regulate suggestions
        this.suggestion = data.message;
        this.socketListSuggestion = data.message_list;

        // Cheking for the prediction wait text if it is mapping with suggestion
        if (this.predictionWaitText !== "") {
          if (this.suggestion.startsWith(this.predictionWaitText)){

            // Updating the suggestion with the prediction wait text
            this.completionProvider.updateSuggestion(this.suggestion.substring(this.predictionWaitText.length));
            this.chatCompletionMessage("partial_completion", 'prediction_wait_feature', this.predictionWaitText.length);
            this.predictionWaitText = "";

          }else{

            this.completionProvider.updateSuggestion(this.suggestion);
          }
        }else{
          this.completionProvider.updateSuggestion(this.suggestion);
        }
        this.triggerInlineSuggestion();
      }
    });

    // Handling completion in case of rate limit exceeded
    this.socket.on('rate_limit_exceeded', (data: any) => {

      StatusBarManager.updateMessage(`Neo`); // Reseeting Status bar to Neo
      this.rateLimitExceeded = true; // Current status is rate limit exceded.
      this.predictionRequestInProgress = true; // Setting up the prediction request is progress to true
      this.suggestion = ""; // Setting up the suggestion to empty
      this.socketListSuggestion = []; // Setting up the socket list suggestion to empty
      this.completionProvider.updateSuggestion(""); // Setting up the completion provider suggestion to empty

      // Showing a popup to users to try after 15 minutes
      vscode.window.showWarningMessage(
        "Rate limit exceeded. Please try after 15 minutes.",
        " OK "
      )   
      
      if (this.rateLimitTimer) { // Clearing rate limited time to set to zero
        clearTimeout(this.rateLimitTimer);
      }
      this.rateLimitTimer = setTimeout(() => { // 15 minutes timeout
        this.rateLimitExceeded = false;
      }, 15 * 60 * 1000);
    });

    // In case of user is using previous bersion of the app
    this.socket.on('update_app_version', (data: any) => {
      if (this.isUpdatePopupShown) { // If popup is already shown then no need to show again
        console.log("Popup already shown. No need to show again.")
        return;
      } else {

        // Showing a popup to users to update the app
        console.log("Neo Copilot updated version available. User need to update the app.")
        const extensionId = data.extension_id;
        const newRequiredVersion = data.latest_version;
        this.promptUpdate(extensionId, newRequiredVersion);}
        this.isUpdatePopupShown = true;
    });

    return this.socket;
  }

  // Sending codes to backend for code completion
  public emitMessage(uuid: string, prefix: string, suffix: string, inputType: string, language: string ) {

    if (this.rateLimitExceeded) { // No action if rate limit is exceded
      this.suggestion = ""; // Setting up the suggestion to empty
      this.socketListSuggestion = []; // Setting up the socket list suggestion to empty
      this.completionProvider.updateSuggestion(""); // Setting up the completion provider suggestion to empty
      return;
    }
    // console.log("Emit Message - ",uuid);
    this.predictionRequestInProgress = true; // Setting up the prediction request is progress to true
    this.suggestion = ""; // Setting up the suggestion to empty
    this.socketListSuggestion = []; // Setting up the socket list suggestion to empty
    this.completionProvider.updateSuggestion(""); // Setting up the completion provider suggestion to empty
    StatusBarManager.updateMessage(`$(loading~spin)`); // Setting up the status bar to loading

    // console.log("prefix - ", JSON.stringify(prefix));
    // console.log("suffix - ", JSON.stringify(suffix));

    this.tempUniqueIdentifier = uuid; // assingning the unique id to the temp unique id
    if (this.socket) { // sending the message to the server
      this.socket.emit('send_message', { prefix, suffix, inputType, uuid, appVersion: this.currentVersion, language});
    }
  }

  // Sending completion message summary to backend
  public chatCompletionMessage(completion_type: string, completion_comment: string, completion_size: number) {
    if (this.rateLimitExceeded) { // No action if rate limit is exceded
      return;
    }
    // Sending Completion report to backend
    if (this.socket) {
      this.socket.emit('completion_accepted', {
        uuid: this.currentSuggestionId,
        completion_type,
        completion_comment,
        completion_size,
      });
    }
  }

  // Sending miscellaneous information to backend
  public customInformationMessage(infomration_type: string, information_comment: string) {
    if (this.rateLimitExceeded) { // No action if rate limit is exceded
      return;
    }
    // Sending Completion report to backend
    if (this.socket) {
      this.socket.emit('custom_information', {
        uuid: uuidv4(),
        infomration_type,
        information_comment,
      });
    }
  }

  // Disconnecting the socket
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private triggerInlineSuggestion() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
      } else {
      }
    }, 10);
  }

  private promptUpdate(extensionId: string, newRequiredVersion: string) {
    vscode.window.showWarningMessage(
      `You are using an outdated version of this extension. Please update to the latest version (${newRequiredVersion}).`,
      'Update Now'
    ).then((selection: string | undefined) => { // Explicitly type the parameter
      if (selection === 'Update Now') {
        this.customInformationMessage('update_app_button_clicked', `User clicked on update button to update the app to ${newRequiredVersion}`);
        this.openExtensionInMarketplace(extensionId);
      }
    });
  }

  private openExtensionInMarketplace(extensionId: string) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`vscode:extension/${extensionId}`));
  }
}
