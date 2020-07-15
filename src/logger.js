"use strict";

const _ = require("lodash");
const path = require("path");
const log4js = require("log4js");

const isString = (obj) => {
  return Object.prototype.toString.call(obj) === "[object String]";
};

const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === "[object Object]";
};

class Logger {
  constructor() {
    // instance variables
  }

  static debug(...messages) {
    const line = this._genareteLine(messages);
    Logger.logger.debug(line);
  }

  static info(...messages) {
    const line = this._genareteLine(messages);
    Logger.logger.info(line);
  }

  static error(...messages) {
    const line = this._genareteLine(messages);
    Logger.logger.error(line);
  }

  static _genareteLine(messages) {
    // メッセージを結合する
    const messageStrings = _.map(messages, (m) => {
      if (isString(m)) {
        return m.trim();
      }

      if (isObject(m)) {
        // return JSON.stringify(m, null, 2);
        return JSON.stringify(m);
      }

      return String(m);
    });

    const margedMessage = messageStrings.join(" ");

    // メソッド名、行数を追加する
    const caller = path.basename(new Error().stack.split("at ")[2].trim()).split(":");
    const file_name = caller[0];
    const line_number = caller[1];

    const message = "f: " + file_name + " l: " + line_number + " m: " + margedMessage;
    return message;
  }
}

const homeDirPath = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];

const config = {
  appenders: {
    consoleLog: {
      type: "console",
    },
    fileLog: {
      type: "file",
      filename: path.join(homeDirPath, ".smart_factory", "inspection-results-server.log"),
      maxLogSize: 5 * 1000 * 1000,
      backups: 5,
      keepFileExt: true,
    },
  },
  categories: {
    default: {
      appenders: ["consoleLog", "fileLog"],
      level: "ALL",
    },
  },
};

log4js.configure(config);
Logger.logger = log4js.getLogger();

module.exports = Logger;
