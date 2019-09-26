"use strict";
import _ from "lodash";
import fs from "fs";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
const app = express();

interface Config {
  listening_port: number;
  interval_minutes: number;
  offset_count: number;
}

interface Counter {
  total: number;
}

class NostalgicCounter {
  private rootPath: string;
  private config: Config;

  constructor() {
    // instance variables
    this.rootPath = path.dirname(import.meta.url.replace("file:///", ""));
    this.config = this.readJSON(
      path.resolve(this.rootPath, "json", "config.json")
    ) as Config;

    this.initServer();
  }

  public start() {
    app.listen(this.config.listening_port, () => {
      console.log("listening on port " + this.config.listening_port + "!");
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

      let counter: Counter = this.readJSON(
        path.resolve(this.rootPath, "json", "counter.json")
      ) as Counter;

      // console.log(req.headers["x-forwarded-for"]);
      // console.log(req.connection.remoteAddress);
      // console.log(req.headers.host);

      const host: string = req.headers["x-forwarded-for"] as string;
      if (this.isIntervalOK(host)) {
        counter = this.incrementCounter(counter);
      }

      res.send({ total: counter.total + this.config.offset_count });
    });
  }

  private readJSON(path: string) {
    const json: Object = JSON.parse(
      fs.readFileSync(path, { encoding: "utf-8" })
    );
    return json;
  }

  private writeJSON(path: string, json: Object) {
    const jsonStr: string = JSON.stringify(json, null, "  ");
    fs.writeFileSync(path, jsonStr, { encoding: "utf-8" });
  }

  private incrementCounter(src: Counter) {
    const counter: Counter = {
      total: src.total + 1
    };

    this.writeJSON(
      path.resolve(this.rootPath, "json", "counter.json"),
      counter
    );
    return counter;
  }

  private isIntervalOK(host: string) {
    var now = new Date();

    const ips: any = this.readJSON(
      path.resolve(this.rootPath, "json", "ips.json")
    );
    if (ips[host]) {
      const pre = new Date(ips[host]);
      if (
        now.getTime() - pre.getTime() <
        this.config.interval_minutes * 60 * 1000
      ) {
        return false;
      }
    }

    ips[host] = now;
    this.writeJSON(path.resolve(this.rootPath, "json", "ips.json"), ips);
    return true;
  }
}

// module.exports = NostalgicCounter;
export default NostalgicCounter;
