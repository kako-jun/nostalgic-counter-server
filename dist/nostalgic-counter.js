"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = __importDefault(require("os"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var moment_1 = __importDefault(require("moment"));
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
var NostalgicCounter = (function () {
    function NostalgicCounter(listening_port) {
        if (listening_port === void 0) { listening_port = 42011; }
        this.rootPath = path_1.default.resolve(os_1.default.homedir(), ".nostalgic-counter");
        if (!this.exist(path_1.default.resolve(this.rootPath, "json"))) {
            fs_1.default.mkdirSync(path_1.default.resolve(this.rootPath, "json"), { recursive: true });
            this.createIDFiles("default", "password", 0, 0);
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "config.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "config.json"), {
                listening_port: listening_port
            });
        }
        this.appConfig = this.readJSON(path_1.default.resolve(this.rootPath, "json", "config.json"));
        this.initServer();
    }
    NostalgicCounter.prototype.start = function () {
        var _this = this;
        app.listen(this.appConfig.listening_port, function () {
            console.log("listening on port " + _this.appConfig.listening_port + "!");
        });
    };
    NostalgicCounter.prototype.initServer = function () {
        var _this = this;
        app.set("trust proxy", true);
        app.use(body_parser_1.default.urlencoded({
            extended: true
        }));
        app.use(body_parser_1.default.json());
        app.get("/api/new", function (req, res) {
            console.log("/api/new called.");
            var id = "default";
            if (req.query.id !== undefined) {
                id = req.query.id;
            }
            var password = "password";
            if (req.query.password !== undefined) {
                password = req.query.password;
            }
            if (!_this.createIDFiles(id, password, 0, 0)) {
                res.send({ error: "ID '" + id + "' already exists." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            res.send(idConfig);
        });
        app.get("/api/config", function (req, res) {
            console.log("/api/config called.");
            var id = "default";
            if (req.query.id !== undefined) {
                id = req.query.id;
            }
            var password = "password";
            if (req.query.password !== undefined) {
                password = req.query.password;
            }
            var interval_minutes = 0;
            if (req.query.interval_minutes !== undefined) {
                interval_minutes = Number(req.query.interval_minutes);
            }
            var offset_count = 0;
            if (req.query.offset_count !== undefined) {
                offset_count = Number(req.query.offset_count);
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({
                    error: "Wrong ID or password."
                });
                return;
            }
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"), {
                interval_minutes: interval_minutes,
                offset_count: offset_count
            });
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            res.send(idConfig);
        });
        app.get("/api/reset", function (req, res) {
            console.log("/api/reset called.");
            var id = "default";
            if (req.query.id !== undefined) {
                id = req.query.id;
            }
            var password = "password";
            if (req.query.password !== undefined) {
                password = req.query.password;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({
                    error: "Wrong ID or password."
                });
                return;
            }
            var now = moment_1.default();
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "counter.json"), {
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
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            var counter = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "counter.json"));
            res.send({ total: counter.total + idConfig.offset_count });
        });
        app.get("/api/counter", function (req, res) {
            console.log("/api/counter called.");
            var id = "default";
            if (req.query.id !== undefined) {
                id = req.query.id;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            var counter = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "counter.json"));
            var host = req.headers["x-forwarded-for"];
            if (_this.isIntervalOK(idConfig, id, host)) {
                counter = _this.incrementCounter(id, counter, idConfig.offset_count);
            }
            res.send(counter);
        });
    };
    NostalgicCounter.prototype.readJSON = function (jsonPath) {
        var json = JSON.parse(fs_1.default.readFileSync(jsonPath, { encoding: "utf-8" }));
        return json;
    };
    NostalgicCounter.prototype.writeJSON = function (jsonPath, json) {
        var jsonStr = JSON.stringify(json, null, "  ");
        fs_1.default.writeFileSync(jsonPath, jsonStr, { encoding: "utf-8" });
    };
    NostalgicCounter.prototype.exist = function (filePath) {
        try {
            fs_1.default.statSync(filePath);
            return true;
        }
        catch (error) { }
        return false;
    };
    NostalgicCounter.prototype.createIDFiles = function (id, password, interval_minutes, offset_count) {
        var idDirPath = path_1.default.resolve(this.rootPath, "json", id);
        if (this.exist(idDirPath)) {
            return false;
        }
        else {
            fs_1.default.mkdirSync(idDirPath, { recursive: true });
        }
        this.writeJSON(path_1.default.resolve(idDirPath, "password.json"), {
            password: password
        });
        this.writeJSON(path_1.default.resolve(idDirPath, "config.json"), {
            interval_minutes: interval_minutes,
            offset_count: offset_count
        });
        var now = moment_1.default();
        this.writeJSON(path_1.default.resolve(idDirPath, "counter.json"), {
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
        this.writeJSON(path_1.default.resolve(idDirPath, "ips.json"), {});
        return true;
    };
    NostalgicCounter.prototype.isPasswordCorrect = function (id, password) {
        var passwordObject = this.readJSON(path_1.default.resolve(this.rootPath, "json", id, "password.json"));
        if (password === passwordObject.password) {
            return true;
        }
        return false;
    };
    NostalgicCounter.prototype.incrementCounter = function (id, src, offset_count) {
        var now = moment_1.default();
        var today = 0;
        var today_date = now.format("YYYY-MM-DD");
        if (today_date === src.today_date) {
            today = src.today + 1;
        }
        var yesterday = 0;
        var yesterday_date = now.subtract(1, "day").format("YYYY-MM-DD");
        if (yesterday_date === src.yesterday_date) {
            yesterday = src.yesterday;
        }
        else if (yesterday_date === src.today_date) {
            yesterday = src.today;
        }
        var this_month = 0;
        var this_month_date = now.format("YYYY-MM");
        if (this_month_date === src.this_month_date) {
            this_month = src.this_month + 1;
        }
        var last_month = 0;
        var last_month_date = now.subtract(1, "month").format("YYYY-MM");
        if (last_month_date === src.last_month_date) {
            last_month = src.last_month;
        }
        else if (last_month_date === src.this_month_date) {
            last_month = src.this_month;
        }
        var this_year = 0;
        var this_year_date = now.format("YYYY");
        if (this_year_date === src.this_year_date) {
            this_year = src.this_year + 1;
        }
        var last_year = 0;
        var last_year_date = now.subtract(1, "year").format("YYYY");
        if (last_year_date === src.last_year_date) {
            last_year = src.last_year;
        }
        else if (last_year_date === src.this_year_date) {
            last_year = src.this_year;
        }
        var counter = {
            total: src.total + 1 + offset_count,
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
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", id, "counter.json"), counter);
        return counter;
    };
    NostalgicCounter.prototype.isIntervalOK = function (idConfig, id, host) {
        var now = new Date();
        var ips = this.readJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"));
        if (ips[host]) {
            var pre = new Date(ips[host]);
            if (now.getTime() - pre.getTime() <
                idConfig.interval_minutes * 60 * 1000) {
                return false;
            }
        }
        ips[host] = now;
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"), ips);
        return true;
    };
    return NostalgicCounter;
}());
module.exports = NostalgicCounter;
