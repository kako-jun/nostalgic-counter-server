"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var os_1 = __importDefault(require("os"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var moment_1 = __importDefault(require("moment"));
var crypto_1 = __importDefault(require("crypto"));
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
var NostalgicCounterServer = (function () {
    function NostalgicCounterServer(listening_port) {
        if (listening_port === void 0) { listening_port = 42011; }
        this.rootPath = path_1.default.resolve(os_1.default.homedir(), ".nostalgic-counter");
        if (!this.exist(path_1.default.resolve(this.rootPath, "json"))) {
            fs_1.default.mkdirSync(path_1.default.resolve(this.rootPath, "json"), { recursive: true });
            this.createIDFiles("default", "", 0, 0);
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "config.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "config.json"), {
                listening_port: listening_port,
            });
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"), {
                host_list: [],
            });
        }
        this.appConfig = this.readJSON(path_1.default.resolve(this.rootPath, "json", "config.json"));
        this.initServer();
    }
    NostalgicCounterServer.prototype.start = function () {
        var _this = this;
        app.listen(this.appConfig.listening_port, function () {
            console.log("listening on port " + _this.appConfig.listening_port + "!");
        });
    };
    NostalgicCounterServer.prototype.initServer = function () {
        var _this = this;
        app.set("trust proxy", true);
        app.use(body_parser_1.default.urlencoded({ extended: true }));
        app.use(body_parser_1.default.json());
        app.get("/api/admin/new", function (req, res) {
            console.log("/api/admin/new called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.createIDFiles(id, password, 0, 0)) {
                res.send({ error: "ID '" + id + "' already exists." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            res.send(idConfig);
        });
        app.get("/api/admin/config", function (req, res) {
            console.log("/api/admin/config called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            var interval_minutes = 0;
            if (req.query.interval_minutes !== undefined) {
                if (Number(req.query.interval_minutes) >= 0) {
                    interval_minutes = Number(req.query.interval_minutes);
                }
            }
            else {
                interval_minutes = idConfig.interval_minutes || 0;
            }
            var offset_count = 0;
            if (req.query.offset_count !== undefined) {
                if (Number(req.query.offset_count) >= 0) {
                    offset_count = Number(req.query.offset_count);
                }
            }
            else {
                offset_count = idConfig.offset_count || 0;
            }
            var dstIDConfig = {
                interval_minutes: interval_minutes,
                offset_count: offset_count,
            };
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"), dstIDConfig);
            res.send(dstIDConfig);
        });
        app.get("/api/admin/reset", function (req, res) {
            console.log("/api/admin/reset called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
                return;
            }
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "counter.json"), _this.initialCounter());
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            res.send({ total: idConfig.offset_count });
        });
        app.get("/api/counter", function (req, res) {
            console.log("/api/counter called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (typeof id !== "string") {
                return;
            }
            var ex = false;
            if (req.query.ex !== undefined) {
                ex = true;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            var counter = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "counter.json"));
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            if (_this.isIntervalOK(idConfig, id, host)) {
                counter = _this.incrementCounter(id, counter);
            }
            counter.total += idConfig.offset_count;
            if (ex) {
                res.send(counter);
            }
            else {
                res.send({ total: counter.total });
            }
        });
    };
    NostalgicCounterServer.prototype.initialCounter = function () {
        var now = moment_1.default();
        return {
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
            last_year_date: now.subtract(1, "year").format("YYYY"),
        };
    };
    NostalgicCounterServer.prototype.readJSON = function (jsonPath) {
        var json = JSON.parse(fs_1.default.readFileSync(jsonPath, { encoding: "utf-8" }));
        return json;
    };
    NostalgicCounterServer.prototype.writeJSON = function (jsonPath, json) {
        var jsonStr = JSON.stringify(json, null, 2);
        fs_1.default.writeFileSync(jsonPath, jsonStr, { encoding: "utf-8" });
    };
    NostalgicCounterServer.prototype.exist = function (filePath) {
        try {
            fs_1.default.statSync(filePath);
            return true;
        }
        catch (error) { }
        return false;
    };
    NostalgicCounterServer.prototype.isIgnore = function (host) {
        console.log(host);
        var ignoreList = this.readJSON(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"));
        var found = lodash_1.default.find(ignoreList.host_list, function (h) {
            return h === host;
        });
        if (found) {
            return true;
        }
        return false;
    };
    NostalgicCounterServer.prototype.createIDFiles = function (id, password, interval_minutes, offset_count) {
        var idDirPath = path_1.default.resolve(this.rootPath, "json", id);
        if (this.exist(idDirPath)) {
            return false;
        }
        else {
            fs_1.default.mkdirSync(idDirPath, { recursive: true });
        }
        var cipher = crypto_1.default.createCipher("aes128", "42");
        cipher.update(password, "utf8", "hex");
        var cipheredText = cipher.final("hex");
        this.writeJSON(path_1.default.resolve(idDirPath, "password.json"), {
            password: cipheredText,
        });
        this.writeJSON(path_1.default.resolve(idDirPath, "config.json"), {
            interval_minutes: interval_minutes,
            offset_count: offset_count,
        });
        this.writeJSON(path_1.default.resolve(idDirPath, "counter.json"), this.initialCounter());
        this.writeJSON(path_1.default.resolve(idDirPath, "ips.json"), {});
        return true;
    };
    NostalgicCounterServer.prototype.isPasswordCorrect = function (id, password) {
        var passwordObject = this.readJSON(path_1.default.resolve(this.rootPath, "json", id, "password.json"));
        var decipher = crypto_1.default.createDecipher("aes128", "42");
        decipher.update(passwordObject.password, "hex", "utf8");
        var decipheredText = decipher.final("utf8");
        if (password === decipheredText) {
            return true;
        }
        return false;
    };
    NostalgicCounterServer.prototype.incrementCounter = function (id, src) {
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
            last_year_date: last_year_date,
        };
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", id, "counter.json"), counter);
        return counter;
    };
    NostalgicCounterServer.prototype.isIntervalOK = function (idConfig, id, host) {
        var now = moment_1.default();
        var ips = this.readJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"));
        if (ips[host]) {
            var pre = moment_1.default(ips[host]);
            if (now.valueOf() - pre.valueOf() < idConfig.interval_minutes * 60 * 1000) {
                return false;
            }
        }
        ips[host] = now;
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"), ips);
        return true;
    };
    return NostalgicCounterServer;
}());
module.exports = NostalgicCounterServer;
