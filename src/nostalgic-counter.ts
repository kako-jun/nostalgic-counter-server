"use strict";
import _ from "lodash";
import os from "os";
import fs from "fs";
import path from "path";
import moment from "moment";
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
  today: number;
  today_date: string;
  yesterday: number;
  yesterday_date: string;
  this_month: number;
  this_month_date: string;
  last_month: number;
  last_month_date: string;
  this_year: number;
  this_year_date: string;
  last_year: number;
  last_year_date: string;
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

      this.writeJSON(path.resolve(this.rootPath, "json", id, "config.json"), {
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

      const now = moment();
      this.writeJSON(path.resolve(this.rootPath, "json", id, "counter.json"), {
        total: 0,
        today: 0,
        today_date: now.format("YYYY-MM-DD"),
        yesterday: 0,
        yesterday_date: now.subtract(1, "day").format("YYYY-MM-DD"),
        this_month: 0,
        this_month_date: now.format("YYYY-MM"),
        last_month: 0,
        last_month_date: now.subtract(1, "month").format("YYYY-MM"),
        this_year: 0,
        this_year_date: now.format("YYYY"),
        last_year: 0,
        last_year_date: now.subtract(1, "year").format("YYYY")
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

    const now = moment();
    this.writeJSON(path.resolve(idDirPath, "counter.json"), {
      total: 0,
      today: 0,
      today_date: now.format("YYYY-MM-DD"),
      yesterday: 0,
      yesterday_date: now.subtract(1, "day").format("YYYY-MM-DD"),
      this_month: 0,
      this_month_date: now.format("YYYY-MM"),
      last_month: 0,
      last_month_date: now.subtract(1, "month").format("YYYY-MM"),
      this_year: 0,
      this_year_date: now.format("YYYY"),
      last_year: 0,
      last_year_date: now.subtract(1, "year").format("YYYY")
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
    const now = moment();

    let today = 0;
    const today_date = now.format("YYYY-MM-DD");
    if (today_date === src.today_date) {
      today = src.today + 1;
    }

    let yesterday = 0;
    const yesterday_date = now.subtract(1, "day").format("YYYY-MM-DD");
    if (yesterday_date === src.yesterday_date) {
      yesterday = src.yesterday + 1;
    }

    let this_month = 0;
    const this_month_date = now.format("YYYY-MM");
    if (this_month_date === src.this_month_date) {
      this_month = src.this_month + 1;
    }

    let last_month = 0;
    const last_month_date = now.subtract(1, "month").format("YYYY-MM");
    if (last_month_date === src.last_month_date) {
      last_month = src.last_month + 1;
    }

    let this_year = 0;
    const this_year_date = now.format("YYYY");
    if (this_year_date === src.this_year_date) {
      this_year = src.this_year + 1;
    }

    let last_year = 0;
    const last_year_date = now.subtract(1, "year").format("YYYY");
    if (last_year_date === src.last_year_date) {
      last_year = src.last_year + 1;
    }

    const counter: Counter = {
      total: src.total + 1,
      today: today,
      today_date: today_date,
      yesterday: yesterday,
      yesterday_date: yesterday_date,
      this_month: this_month,
      this_month_date: this_month_date,
      last_month: last_month,
      last_month_date: last_month_date,
      this_year: this_year,
      this_year_date: this_year_date,
      last_year: last_year,
      last_year_date: last_year_date
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
