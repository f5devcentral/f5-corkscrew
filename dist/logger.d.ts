/**
 * logger class to log information to OUTPUT console of vscode window
 * prefer to use logger.debug, but feel free to explore others
 * example: logger.debug('chuck-joke->resp.data', resp.data);
 */
declare class Log {
    private _journal;
    private readonly _logLevel;
    constructor(level?: LogLevel);
    /**
     * Log collector
     * @param msg debug message to log
     */
    debug(...msg: [unknown, ...unknown[]]): void;
    /**
     * Log collector
     * @param msg info message to log
     */
    info(...msg: [unknown, ...unknown[]]): void;
    /**
     * Log collector
     * @param msg error message to log
     */
    error(...msg: [unknown, ...unknown[]]): void;
    write(label: string, ...messageParts: unknown[]): void;
    /**
     * returns logs as string
     */
    getLogs(): string[];
    private init;
    private stringify;
}
declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Error = 2
}
declare const logger: Log;
export default logger;
