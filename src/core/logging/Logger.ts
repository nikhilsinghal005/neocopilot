export enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR'
}

export class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel = LogLevel.info;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levelOrder: LogLevel[] = [
      LogLevel.debug,
      LogLevel.info,
      LogLevel.warn,
      LogLevel.error
    ];
    return (
      levelOrder.indexOf(level) >= levelOrder.indexOf(this.currentLevel)
    );
  }

  debug(message: string, ...data: unknown[]) {
    if (this.shouldLog(LogLevel.debug)) {
      console.debug(`[DEBUG] ${message}`, ...data);
    }
  }

  info(message: string, ...data: unknown[]) {
    if (this.shouldLog(LogLevel.info)) {
      console.info(`[INFO] ${message}`, ...data);
    }
  }

  warn(message: string, ...data: unknown[]) {
    if (this.shouldLog(LogLevel.warn)) {
      console.warn(`[WARN] ${message}`, ...data);
    }
  }

  error(message: string, ...data: unknown[]) {
    if (this.shouldLog(LogLevel.error)) {
      console.error(`[ERROR] ${message}`, ...data);
    }
  }
}