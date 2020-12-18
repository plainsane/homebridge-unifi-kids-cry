"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UBNTClient = void 0;
const restm = require("typed-rest-client/RestClient");
const baseOpts = {
    ignoreSslError: true
};
class UBNTClient {
    constructor(base, site, unifios, user, password) {
        this.auth = {
            username: user,
            password: password
        };
        this.site = site;
        this.unifios = unifios;
        this.client = new restm.RestClient('typed-rest-client-__tests__', base, undefined, baseOpts);
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.client.create(this.unifios ? "/api/auth/login" : "/api/login", this.auth);
            let cookies = resp.headers['set-cookie'];
            let reqOpts = {
                additionalHeaders: { cookie: cookies }
            };
            return reqOpts;
        });
    }
    blockMac(mac) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = { mac: mac };
            let auth = yield this.login();
            let res = yield this.client.create(`${this.unifios ? "/network/proxy" : ""}/api/s/${this.site}/cmd/stamgr/block-sta`, data, auth);
            return res.statusCode === 200;
        });
    }
    unblockMac(mac) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = { mac: mac };
            let auth = yield this.login();
            let res = yield this.client.create(`${this.unifios ? "/network/proxy" : ""}/api/s/${this.site}/cmd/stamgr/unblock-sta`, data, auth);
            return res.statusCode === 200;
        });
    }
    isBlocked(mac) {
        return __awaiter(this, void 0, void 0, function* () {
            let auth = yield this.login();
            let ret = yield this.client.get(`${this.unifios ? "/network/proxy" : ""}/api/s/${this.site}/stat/user/${mac}`, auth);
            return ret.result.data[0].blocked;
        });
    }
}
exports.UBNTClient = UBNTClient;
//# sourceMappingURL=ubntClient.js.map