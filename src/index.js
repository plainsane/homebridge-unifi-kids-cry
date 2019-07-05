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
const ubntClient_1 = require("./ubntClient");
const platform_1 = require("./platform");
var Accessory, Service, Characteristic, UUIDGen;
function doit() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = new ubntClient_1.UBNTClient('https://ftp:8443', "default", 'api', 'Plainsane8000');
        let foo = yield client.isBlocked("4c:bb:58:cd:5b:77");
        console.log(JSON.stringify(foo));
        //await client.blockMac("4c:bb:58:cd:5b:77")
        //await client.unblockMac("4c:bb:58:cd:5b:77")
        return undefined;
    });
}
module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);
    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;
    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform("homebridge-unifi-kids-cry", "UnifiMacBlocker", platform_1.UnifiKidsCry, true);
};
doit();
//# sourceMappingURL=index.js.map