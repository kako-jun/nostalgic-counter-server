"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = __importDefault(require("os"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
var NostalgicCounter = (function () {
    function NostalgicCounter(listening_port) {
        if (listening_port === void 0) { listening_port = 42011; }
        this.rootPath = path_1.default.resolve(os_1.default.homedir(), ".nostalgic-counter");
        if (!this.exist(path_1.default.resolve(this.rootPath, "json"))) {
            fs_1.default.mkdirSync(path_1.default.resolve(this.rootPath, "json"), { recursive: true });
            this.createUserFiles("default", 0, 0);
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
        app.get("/api/counter", function (req, res) {
            console.log("/api/counter called.");
            var user = "default";
            if (req.query.user !== undefined) {
                user = req.query.user;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", user))) {
                res.send({});
                return;
            }
            var userConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", user, "config.json"));
            var counter = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", user, "counter.json"));
            var host = req.headers["x-forwarded-for"];
            if (_this.isIntervalOK(userConfig, user, host)) {
                counter = _this.incrementCounter(user, counter);
            }
            res.send({ total: counter.total + userConfig.offset_count });
        });
        app.get("/api/config", function (req, res) {
            console.log("/api/config called.");
            var user = "default";
            if (req.query.user !== undefined) {
                user = req.query.user;
            }
            var interval_minutes = 0;
            if (req.query.interval_minutes !== undefined) {
                interval_minutes = Number(req.query.interval_minutes);
            }
            var offset_count = 0;
            if (req.query.offset_count !== undefined) {
                offset_count = Number(req.query.offset_count);
            }
            _this.createUserFiles(user, interval_minutes, offset_count);
            var userConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", user, "config.json"));
            res.send(userConfig);
        });
        app.get("/api/reset", function (req, res) {
            console.log("/api/reset called.");
            var user = "default";
            if (req.query.user !== undefined) {
                user = req.query.user;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", user))) {
                res.send({});
                return;
            }
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", user, "counter.json"), {
                total: 0
            });
            var userConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", user, "config.json"));
            var counter = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", user, "counter.json"));
            res.send({ total: counter.total + userConfig.offset_count });
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
    NostalgicCounter.prototype.createUserFiles = function (user, interval_minutes, offset_count) {
        var userDirPath = path_1.default.resolve(this.rootPath, "json", user);
        if (!this.exist(userDirPath)) {
            fs_1.default.mkdirSync(userDirPath, { recursive: true });
        }
        this.writeJSON(path_1.default.resolve(userDirPath, "config.json"), {
            interval_minutes: interval_minutes,
            offset_count: offset_count
        });
        if (!this.exist(path_1.default.resolve(userDirPath, "counter.json"))) {
            this.writeJSON(path_1.default.resolve(userDirPath, "counter.json"), {
                total: 0
            });
        }
        if (!this.exist(path_1.default.resolve(userDirPath, "ips.json"))) {
            this.writeJSON(path_1.default.resolve(userDirPath, "ips.json"), {});
        }
    };
    NostalgicCounter.prototype.incrementCounter = function (user, src) {
        var counter = {
            total: src.total + 1
        };
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", user, "counter.json"), counter);
        return counter;
    };
    NostalgicCounter.prototype.isIntervalOK = function (userConfig, user, host) {
        var now = new Date();
        var ips = this.readJSON(path_1.default.resolve(this.rootPath, "json", user, "ips.json"));
        if (ips[host]) {
            var pre = new Date(ips[host]);
            if (now.getTime() - pre.getTime() <
                userConfig.interval_minutes * 60 * 1000) {
                return false;
            }
        }
        ips[host] = now;
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", user, "ips.json"), ips);
        return true;
    };
    return NostalgicCounter;
}());
module.exports = NostalgicCounter;
