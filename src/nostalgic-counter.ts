"use strict";
import _ from "lodash";
import os from "os";
import fs from "fs";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
const app = express();

interface AppConfig {
  listening_port: number;
}

interface UserConfig {
  interval_minutes: number;
  offset_count: number;
}

interface Counter {
  total: number;
}

class NostalgicCounter {
  private rootPath: string;
  private appConfig: AppConfig;

  constructor(listening_port: number = 42011) {
    // instance variables
    // this.rootPath = path.dirname(import.meta.url.replace("file:///", ""));
    // this.rootPath = __dirname;
    this.rootPath = path.resolve(os.homedir(), ".nostalgic-counter");
    if (!this.exist(path.resolve(this.rootPath, "json"))) {
      fs.mkdirSync(path.resolve(this.rootPath, "json"), { recursive: true });
      this.createUserFiles("default", 0, 0);
    }

    if (!this.exist(path.resolve(this.rootPath, "json", "config.json"))) {
      this.writeJSON(path.resolve(this.rootPath, "json", "config.json"), {
        listening_port: listening_port
      });
    }

    this.appConfig = this.readJSON(
      path.resolve(this.rootPath, "json", "config.json")
    ) as AppConfig;

    this.initServer();
  }

  public start() {
    app.listen(this.appConfig.listening_port, () => {
      console.log("listening on port " + this.appConfig.listening_port + "!");
    });
  }

  private initServer() {
    app.set("trust proxy", true);

    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        res.header("Content-Type", "application/json");
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header(
          "Access-Control-Allow-Methods",
          "POST, GET, PUT, DELETE, OPTIONS"
        );
        next();
      }
    );

    app.use(
      bodyParser.urlencoded({
        extended: true
      })
    );

    app.use(bodyParser.json());

    app.get("/api/counter", (req: express.Request, res: express.Response) => {
      console.log("/api/counter called.");

      let user = "default";
      if (req.query.user !== undefined) {
        user = req.query.user;
      }

      if (!this.exist(path.resolve(this.rootPath, "json", user))) {
        res.send({});
        return;
      }

      const userConfig = this.readJSON(
        path.resolve(this.rootPath, "json", user, "config.json")
      ) as UserConfig;

      let counter = this.readJSON(
        path.resolve(this.rootPath, "json", user, "counter.json")
      ) as Counter;

      // console.log(req.headers["x-forwarded-for"]);
      // console.log(req.connection.remoteAddress);
      // console.log(req.headers.host);

      const host = req.headers["x-forwarded-for"] as string;
      if (this.isIntervalOK(userConfig, user, host)) {
        counter = this.incrementCounter(user, counter);
      }

      res.send({ total: counter.total + userConfig.offset_count });
    });

    app.get("/api/config", (req: express.Request, res: express.Response) => {
      console.log("/api/config called.");

      let user = "default";
      if (req.query.user !== undefined) {
        user = req.query.user;
      }

      let interval_minutes = 0;
      if (req.query.interval_minutes !== undefined) {
        interval_minutes = Number(req.query.interval_minutes);
      }

      let offset_count = 0;
      if (req.query.offset_count !== undefined) {
        offset_count = Number(req.query.offset_count);
      }

      this.createUserFiles(user, interval_minutes, offset_count);

      const userConfig = this.readJSON(
        path.resolve(this.rootPath, "json", user, "config.json")
      ) as UserConfig;

      res.send(userConfig);
    });

    app.get("/api/reset", (req: express.Request, res: express.Response) => {
      console.log("/api/reset called.");

      let user = "default";
      if (req.query.user !== undefined) {
        user = req.query.user;
      }

      if (!this.exist(path.resolve(this.rootPath, "json", user))) {
        res.send({});
        return;
      }

      this.writeJSON(
        path.resolve(this.rootPath, "json", user, "counter.json"),
        {
          total: 0
        }
      );

      const userConfig = this.readJSON(
        path.resolve(this.rootPath, "json", user, "config.json")
      ) as UserConfig;

      const counter: Counter = this.readJSON(
        path.resolve(this.rootPath, "json", user, "counter.json")
      ) as Counter;

      res.send({ total: counter.total + userConfig.offset_count });
    });
  }

  private readJSON(jsonPath: string) {
    const json: Object = JSON.parse(
      fs.readFileSync(jsonPath, { encoding: "utf-8" })
    );
    return json;
  }

  private writeJSON(jsonPath: string, json: Object) {
    const jsonStr = JSON.stringify(json, null, "  ");
    fs.writeFileSync(jsonPath, jsonStr, { encoding: "utf-8" });
  }

  private exist(filePath: string) {
    try {
      fs.statSync(filePath);
      return true;
    } catch (error) {}

    return false;
  }

  private createUserFiles(
    user: string,
    interval_minutes: number,
    offset_count: number
  ) {
    const userDirPath = path.resolve(this.rootPath, "json", user);
    if (!this.exist(userDirPath)) {
      fs.mkdirSync(userDirPath, { recursive: true });
    }

    this.writeJSON(path.resolve(userDirPath, "config.json"), {
      interval_minutes: interval_minutes,
      offset_count: offset_count
    });

    if (!this.exist(path.resolve(userDirPath, "counter.json"))) {
      this.writeJSON(path.resolve(userDirPath, "counter.json"), {
        total: 0
      });
    }

    if (!this.exist(path.resolve(userDirPath, "ips.json"))) {
      this.writeJSON(path.resolve(userDirPath, "ips.json"), {});
    }
  }

  private incrementCounter(user: string, src: Counter) {
    const counter: Counter = {
      total: src.total + 1
    };

    this.writeJSON(
      path.resolve(this.rootPath, "json", user, "counter.json"),
      counter
    );
    return counter;
  }

  private isIntervalOK(userConfig: UserConfig, user: string, host: string) {
    var now = new Date();

    const ips: any = this.readJSON(
      path.resolve(this.rootPath, "json", user, "ips.json")
    );
    if (ips[host]) {
      const pre = new Date(ips[host]);
      if (
        now.getTime() - pre.getTime() <
        userConfig.interval_minutes * 60 * 1000
      ) {
        return false;
      }
    }

    ips[host] = now;
    this.writeJSON(path.resolve(this.rootPath, "json", user, "ips.json"), ips);
    return true;
  }
}

module.exports = NostalgicCounter;
// export default NostalgicCounter;
