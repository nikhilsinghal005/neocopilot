// versionConfig.ts
import * as vscode from 'vscode';

class VersionConfig {
  private static instance: VersionConfig;
  private currentVersion: string | null = null;

  private constructor() {}

  public static getInstance(): VersionConfig {
    if (!VersionConfig.instance) {
      VersionConfig.instance = new VersionConfig();
    }
    return VersionConfig.instance;
  }

  public initialize(context: vscode.ExtensionContext) {
      this.currentVersion = context.extension.packageJSON.version;
    //   // console.log(`current version: ${this.currentVersion}`);
      context.globalState.update('currentVersion', this.currentVersion);
  }

  public getCurrentVersion(): string {
    // // console.log(`current version updated: ${this.currentVersion}`);
    if (!this.currentVersion) {
      return 'unknown';
    }else{
      return this.currentVersion;
    }
  }

  public updateVersion(context: vscode.ExtensionContext) {
    this.currentVersion = context.extension.packageJSON.version;
    context.globalState.update('currentVersion', this.currentVersion);
  }
}

export const versionConfig = VersionConfig.getInstance();
