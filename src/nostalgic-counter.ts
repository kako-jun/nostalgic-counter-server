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

interface Password {
  password: string;
}

interface IDConfig {
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
      this.createIDFiles("default", "password", 0, 0);
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

    // app.use(
    //   (
    //     req: express.Request,
    //     res: express.Response,
    //     next: express.NextFunction
    //   ) => {
    //     res.header("Content-Type", "application/json");
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header(
    //       "Access-Control-Allow-Headers",
    //       "Origin, X-Requested-With, Content-Type, Accept"
    //     );
    //     res.header(
    //       "Access-Control-Allow-Methods",
    //       "POST, GET, PUT, DELETE, OPTIONS"
    //     );
    //     next();
    //   }
    // );

    app.use(
      bodyParser.urlencoded({
        extended: true
      })
    );

    app.use(bodyParser.json());

    app.get("/api/new", (req: express.Request, res: express.Response) => {
      console.log("/api/new called.");

      let id = "default";
      if (req.query.id !== undefined) {
        id = req.query.id;
      }

      let password = "password";
      if (req.query.password !== undefined) {
        password = req.query.password;
      }

      if (!this.createIDFiles(id, password, 0, 0)) {
        res.send({ error: "ID '" + id + "' already exists." });
        return;
      }

      const idConfig = this.readJSON(
        path.resolve(this.rootPath, "json", id, "config.json")
      ) as IDConfig;

      res.send(idConfig);
    });

    app.get("/api/config", (req: express.Request, res: express.Response) => {
      console.log("/api/config called.");

      let id = "default";
      if (req.query.id !== undefined) {
        id = req.query.id;
      }

      let password = "password";
      if (req.query.password !== undefined) {
        password = req.query.password;
      }

      let interval_minutes = 0;
      if (req.query.interval_minutes !== undefined) {
        interval_minutes = Number(req.query.interval_minutes);
      }

      let offset_count = 0;
      if (req.query.offset_count !== undefined) {
        offset_count = Number(req.query.offset_count);
      }

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({
          error: "ID '" + id + "' not found."
        });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({
          error: "Wrong ID or password."
        });
        return;
      }

      this.writeJSON(path.resolve(this.rootPath, "json", "config.json"), {
        interval_minutes: interval_minutes,
        offset_count: offset_count
      });

      const idConfig = this.readJSON(
        path.resolve(this.rootPath, "json", id, "config.json")
      ) as IDConfig;

      res.send(idConfig);
    });

    app.get("/api/reset", (req: express.Request, res: express.Response) => {
      console.log("/api/reset called.");

      let id = "default";
      if (req.query.id !== undefined) {
        id = req.query.id;
      }

      let password = "password";
      if (req.query.password !== undefined) {
        password = req.query.password;
      }

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({
          error: "ID '" + id + "' not found."
        });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({
          error: "Wrong ID or password."
        });
        return;
      }

      this.writeJSON(path.resolve(this.rootPath, "json", id, "counter.json"), {
        total: 0
      });

      const idConfig = this.readJSON(
        path.resolve(this.rootPath, "json", id, "config.json")
      ) as IDConfig;

      const counter: Counter = this.readJSON(
        path.resolve(this.rootPath, "json", id, "counter.json")
      ) as Counter;

      res.send({ total: counter.total + idConfig.offset_count });
    });

    app.get("/api/counter", (req: express.Request, res: express.Response) => {
      console.log("/api/counter called.");

      let id = "default";
      if (req.query.id !== undefined) {
        id = req.query.id;
      }

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({
          error: "ID '" + id + "' not found."
        });
        return;
      }

      const idConfig = this.readJSON(
        path.resolve(this.rootPath, "json", id, "config.json")
      ) as IDConfig;

      let counter = this.readJSON(
        path.resolve(this.rootPath, "json", id, "counter.json")
      ) as Counter;

      // console.log(req.headers["x-forwarded-for"]);
      // console.log(req.connection.remoteAddress);
      // console.log(req.headers.host);

      const host = req.headers["x-forwarded-for"] as string;
      if (this.isIntervalOK(idConfig, id, host)) {
        counter = this.incrementCounter(id, counter);
      }

      res.send({ total: counter.total + idConfig.offset_count });
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

  private createIDFiles(
    id: string,
    password: string,
    interval_minutes: number,
    offset_count: number
  ) {
    const idDirPath = path.resolve(this.rootPath, "json", id);
    if (this.exist(idDirPath)) {
      return false;
    } else {
      fs.mkdirSync(idDirPath, { recursive: true });
    }

    this.writeJSON(path.resolve(idDirPath, "password.json"), {
      password: password
    });

    this.writeJSON(path.resolve(idDirPath, "config.json"), {
      interval_minutes: interval_minutes,
      offset_count: offset_count
    });

    this.writeJSON(path.resolve(idDirPath, "counter.json"), {
      total: 0
    });

    this.writeJSON(path.resolve(idDirPath, "ips.json"), {});

    return true;
  }

  private isPasswordCorrect(id: string, password: string) {
    const passwordObject = this.readJSON(
      path.resolve(this.rootPath, "json", id, "password.json")
    ) as Password;

    if (password === passwordObject.password) {
      return true;
    }

    return false;
  }

  private incrementCounter(id: string, src: Counter) {
    const counter: Counter = {
      total: src.total + 1
    };

    this.writeJSON(
      path.resolve(this.rootPath, "json", id, "counter.json"),
      counter
    );
    return counter;
  }

  private isIntervalOK(idConfig: IDConfig, id: string, host: string) {
    var now = new Date();

    const ips: any = this.readJSON(
      path.resolve(this.rootPath, "json", id, "ips.json")
    );
    if (ips[host]) {
      const pre = new Date(ips[host]);
      if (
        now.getTime() - pre.getTime() <
        idConfig.interval_minutes * 60 * 1000
      ) {
        return false;
      }
    }

    ips[host] = now;
    this.writeJSON(path.resolve(this.rootPath, "json", id, "ips.json"), ips);
    return true;
  }
}

module.exports = NostalgicCounter;
// export default NostalgicCounter;
