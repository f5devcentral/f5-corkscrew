"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const util_1 = require("util");
/**
 * logger class to log information to OUTPUT console of vscode window
 * prefer to use logger.debug, but feel free to explore others
 * example: logger.debug('chuck-joke->resp.data', resp.data);
 */
class Log {
    constructor(level) {
        this._journal = [];
        this._logLevel = level | LogLevel.Debug;
        this.init(); // used to make it do stuff at initilization for testing
    }
    // /**
    //  * verbose logging to OUTPUT
    //  * @param message message string
    //  * @param data 
    //  */
    // public verbose(message: string, data?: any): void {
    //     this.log(LogLevel.Verbose, message, data);
    // }
    // // public info(message: string, data?: any): void {
    // //     this.log(LogLevel.Info, message, data);
    // // }
    // // public warn(message: string, data?: any): void {
    // //     this.log(LogLevel.Warn, message, data);
    // // }
    // // public error(message: string, data?: any): void {
    // //     this.log(LogLevel.Error, message, data);
    // // }
    // public log(level: LogLevel, message: string, data?: any): void {
    //     if (level >= this._logLevel) {
    //         const date = (new Date().toLocaleTimeString());
    //         this._journal.push(`[${date} - ${LogLevel[level]}] ${message}`);
    //         if (data) {
    //             this._journal.push(this.data2String(data));
    //         }
    //     }
    // }
    /**
     * Log collector
     * @param msg debug message to log
     */
    debug(...msg) {
        this.write('DEBUG', ...msg);
    }
    /**
     * Log collector
     * @param msg info message to log
     */
    info(...msg) {
        this.write('INFO', ...msg);
    }
    /**
     * Log collector
     * @param msg error message to log
     */
    error(...msg) {
        this.write('ERROR', ...msg);
    }
    write(label, ...messageParts) {
        const message = messageParts.map(this.stringify).join(' ');
        const dateTime = new Date().toISOString();
        this._journal.push(`[${dateTime}] ${label}: ${message}`);
    }
    /**
     * returns logs as string
     */
    getLogs() {
        return this._journal.join('\n');
    }
    init() {
        const label = 'DeBuG';
        // const message = 'very special log message';
        const dateTime = new Date();
        const dateT1 = dateTime.toISOString();
        const dateT2 = dateTime.toLocaleString();
        const dateT3 = dateTime.toUTCString();
        this._journal.push(`[${dateT1}] ${label}: 'regular date log message'`);
        this._journal.push(`[${dateT2}] ${label}: 'toLocalString date log message'`);
        this._journal.push(`[${dateT3}] ${label}: 'to UTC date log message'`);
    }
    stringify(val) {
        if (typeof val === 'string') {
            return val;
        }
        return util_1.inspect(val, {
            colors: false,
            depth: 6,
        });
    }
}
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Error"] = 2] = "Error";
})(LogLevel || (LogLevel = {}));
const logger = new Log();
exports.default = logger;
//# sourceMappingURL=logger.js.map