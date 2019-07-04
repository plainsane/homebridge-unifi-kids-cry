"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ubnt = require("ubntClient");
function doit() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = ubnt.UBNTClient('https://ftp:8443', 'api', 'Plainsane8000');
        let shitShit = yield _rest.create("/api/s/default/cmd/stamgr/block-sta", mac, reqOpts);
        console.log(JSON.stringify(shitShit));
        yield new Promise(resolve => {
            setTimeout(resolve, 30000);
        });
        let shitShitShit = yield _rest.create("/api/s/default/cmd/stamgr/unblock-sta", mac, reqOpts);
    });
}
doit();
//# sourceMappingURL=index.js.map