"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ubntClient_1 = require("./ubntClient");
var Accessory, Service, Characteristic, UUIDGen;
class UnifiKidsCry {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.accessories = [];
        if (config === undefined) {
            return;
        }
        this.log = log;
        this.api = api;
        this.client = new ubntClient_1.UBNTClient(config.base, config.site, config.username, config.password);
        this.api.on('didFinishLaunching', () => this.finishedLoading(config));
    }
    configureAccessory(accessory) {
        this.accessories.push(accessory);
        this.bindService(accessory.getService("network"), accessory.context.mac);
    }
    finishedLoading(config) {
        //now del the ole stale shit
        for (let acc of this.accessories) {
            if (config.devices.filter((d) => d.mac === acc.context.mac).length === 0) {
                this.log(`removing ${acc.context.mac}`);
                this.api.unregisterPlatformAccessories("homebridge-unifi-kids-cry", "UnifiMacBlocker", [acc]);
            }
        }
        //add the new hotness
        for (let dev of config.devices) {
            if (this.accessories.filter((t) => t.context.mac === dev.mac).length === 0) {
                this.createAccessory(dev);
            }
        }
    }
    createAccessory(dev) {
        let uuid = UUIDGen.generate(dev.mac);
        var newAccessory = new Accessory(dev.mac, uuid);
        newAccessory.context.mac = dev.mac;
        newAccessory.reachable = true;
        newAccessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.SerialNumber, dev.mac);
        let service = newAccessory.addService(Service.LockMechanism, "network");
        this.bindService(service, dev.mac);
        this.api.registerPlatformAccessories("homebridge-unifi-kids-cry", "UnifiMacBlocker", [newAccessory]);
        this.log(`added ${dev.name} at mac ${dev.mac}`);
    }
    bindService(service, mac) {
        let clazz = this;
        service.getCharacteristic(Characteristic.LockTargetState)
            .on('set', function (value, callback) {
            if (value === Characteristic.LockCurrentState.SECURED) {
                clazz.client.blockMac(mac)
                    .then(() => callback(null))
                    .catch((shit) => {
                    clazz.log(shit);
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null);
                });
            }
            else if (value === Characteristic.LockCurrentState.UNSECURED) {
                clazz.client.unblockMac(mac)
                    .then(() => callback(null))
                    .catch((shit) => {
                    clazz.log(shit);
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null);
                });
            }
            else {
                clazz.log(`a lock state of ${value} was requested on mac ${mac} but this is unsupported`);
                clazz.client.isBlocked(mac).then((current) => {
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
                    callback(null);
                }).catch((shit) => {
                    clazz.log(shit);
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null, Characteristic.LockCurrentState.UNKNOWN);
                });
            }
        });
        service.getCharacteristic(Characteristic.LockCurrentState)
            .on('get', function (callback) {
            clazz.log("checking on some shit");
            clazz.client.isBlocked(mac).then((current) => {
                clazz.log(`${mac} blocked ${current}`);
                service.getCharacteristic(Characteristic.LockCurrentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
                callback(null, current === true ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
            }).catch((shit) => {
                clazz.log(shit);
                service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                callback(null, Characteristic.LockCurrentState.UNKNOWN);
            });
        });
    }
}
exports.UnifiKidsCry = UnifiKidsCry;
module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform("homebridge-unifi-kids-cry", "UnifiMacBlocker", UnifiKidsCry, true);
};
//# sourceMappingURL=index.js.map