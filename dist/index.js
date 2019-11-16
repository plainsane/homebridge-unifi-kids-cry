"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ubntClient_1 = require("./ubntClient");
const hap_nodejs_1 = require("hap-nodejs");
const moduleName = "homebridge-unifi-mac-block";
const platformName = "UnifiMacBlocker";
class UnifiKidsCry {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.accessories = [];
        this.deregister = [];
        this.updating = new Set();
        if (!config) {
            return;
        }
        this.log = log;
        this.api = api;
        this.config = config;
        this.refreshInterval = config['refreshInterval'];
        if (this.refreshInterval === undefined)
            this.refreshInterval = 0;
        this.refreshInterval = this.refreshInterval * 1000;
        this.client = new ubntClient_1.UBNTClient(config.base, config.site, config.username, config.password);
        this.api.on('didFinishLaunching', () => this.finishedLoading());
    }
    configureAccessory(accessory) {
        //now del the ole stale shit
        if (this.config.devices.filter((d) => d.mac === accessory.displayName).length === 0) {
            this.deregister.push(accessory);
            this.log(`removing ${accessory.displayName}`);
        }
        else {
            this.accessories.push(accessory);
            this.bindLockService(accessory, accessory.getService("network"), accessory.displayName);
        }
    }
    manageState(service, value) {
        if (!this.updating.has(service.UUID) && service.getCharacteristic(hap_nodejs_1.Characteristic.LockTargetState).value != value) {
            //we need to get out of our handler and rebroadcast since it is possible this value went out a few millis ago but was incorrect
            //basically, someone switches the value in unifi conftroller then we connect to view the device.
            setTimeout(() => service.getCharacteristic(hap_nodejs_1.Characteristic.LockTargetState).updateValue(value), 1000);
        }
        service.getCharacteristic(hap_nodejs_1.Characteristic.LockCurrentState).updateValue(value);
    }
    refresh(mac, service) {
        if (this.refreshInterval === 0)
            return;
        //this.log(`fetching refreshments for ${mac} ${service.updating}`)
        try {
            this.client.isBlocked(mac).then((current) => {
                //this.log(`on callback ${mac} blocked ${current}`)
                let value = current === true ? hap_nodejs_1.Characteristic.LockCurrentState.SECURED : hap_nodejs_1.Characteristic.LockCurrentState.UNSECURED;
                this.manageState(service, value);
            }).catch((shit) => {
                this.log(shit);
                service.setCharacteristic(hap_nodejs_1.Characteristic.LockCurrentState, hap_nodejs_1.Characteristic.LockCurrentState.UNKNOWN);
            });
        }
        catch (err) {
            this.log(err);
        }
        setTimeout(() => this.refresh(mac, service), this.refreshInterval);
    }
    finishedLoading() {
        this.api.unregisterPlatformAccessories(moduleName, platformName, this.deregister);
        this.deregister = [];
        //add the new hotness
        let config = new Map();
        for (let dev of this.config.devices) {
            config.set(dev.mac, dev);
        }
        this.accessories.forEach((t) => {
            let char = t.getService("network").getCharacteristic(hap_nodejs_1.Characteristic.LockTargetState);
            if (config.get(t.displayName).adminControl === true) {
                char.accessRestrictedToAdmins = [hap_nodejs_1.Access.WRITE];
            }
            config.delete(t.displayName);
        });
        for (let dev of config.values()) {
            this.createAccessory(dev);
        }
    }
    createAccessory(dev) {
        let uuid = hap_nodejs_1.uuid.generate(dev.mac);
        const newAccessory = new hap_nodejs_1.Accessory(dev.mac, uuid);
        newAccessory.updateReachability(true);
        newAccessory.category = hap_nodejs_1.Categories.DOOR_LOCK; //advertise ourself as a lock
        newAccessory.getService(hap_nodejs_1.Service.AccessoryInformation)
            .setCharacteristic(hap_nodejs_1.Characteristic.SerialNumber, dev.mac)
            .setCharacteristic(hap_nodejs_1.Characteristic.Manufacturer, "tears incorporated");
        let lockService = newAccessory.addService(hap_nodejs_1.Service.LockMechanism, "network")
            .setCharacteristic(hap_nodejs_1.Characteristic.Name, dev.name);
        this.bindLockService(newAccessory, lockService, dev.mac);
        lockService.isPrimaryService = true;
        this.api.registerPlatformAccessories(moduleName, platformName, [newAccessory]);
        this.log(`added ${dev.name} at mac ${dev.mac}`);
        this.accessories.push(newAccessory);
    }
    bindLockService(accessory, service, mac) {
        let clazz = this;
        service.getCharacteristic(hap_nodejs_1.Characteristic.LockTargetState)
            .on(hap_nodejs_1.CharacteristicEventTypes.SET, function (value, callback) {
            clazz.updating.add(service.UUID);
            let result;
            if (value === hap_nodejs_1.Characteristic.LockTargetState.SECURED) {
                result = clazz.client.blockMac(mac).then((res) => res === true ? hap_nodejs_1.Characteristic.LockTargetState.SECURED : hap_nodejs_1.Characteristic.LockTargetState.UNSECURED);
                let thing = clazz.client.blockMac(mac).then((res) => res === true ? hap_nodejs_1.Characteristic.LockTargetState.SECURED : hap_nodejs_1.Characteristic.LockTargetState.UNSECURED);
            }
            else if (value === hap_nodejs_1.Characteristic.LockTargetState.UNSECURED) {
                result = clazz.client.unblockMac(mac).then((res) => res === true ? hap_nodejs_1.Characteristic.LockTargetState.UNSECURED : hap_nodejs_1.Characteristic.LockTargetState.SECURED);
            }
            else {
                result = clazz.client.isBlocked(mac).then((current) => {
                    clazz.log(`${mac} is in blocked state ${current}`);
                    return (current === true ? hap_nodejs_1.Characteristic.LockCurrentState.SECURED : hap_nodejs_1.Characteristic.LockCurrentState.UNSECURED);
                });
            }
            result.then((want) => {
                service.getCharacteristic(hap_nodejs_1.Characteristic.LockCurrentState).updateValue(want);
                callback(null);
                clazz.updating.delete(service.UUID);
            })
                .catch((shit) => {
                clazz.log(shit);
                service.getCharacteristic(hap_nodejs_1.Characteristic.LockCurrentState).updateValue(hap_nodejs_1.Characteristic.LockCurrentState.UNKNOWN);
                callback(null);
                clazz.updating.delete(service.UUID);
            });
        });
        service.getCharacteristic(hap_nodejs_1.Characteristic.LockCurrentState)
            .on(hap_nodejs_1.CharacteristicEventTypes.GET, function (callback) {
            clazz.client.isBlocked(mac).then((current) => {
                clazz.log(`${mac} blocked ${current}`);
                let value = current === true ? hap_nodejs_1.Characteristic.LockCurrentState.SECURED : hap_nodejs_1.Characteristic.LockCurrentState.UNSECURED;
                clazz.manageState(service, value);
                callback(null, value);
            }).catch((shit) => {
                clazz.log(shit);
                service.getCharacteristic(hap_nodejs_1.Characteristic.LockCurrentState).updateValue(hap_nodejs_1.Characteristic.LockCurrentState.UNKNOWN);
                callback(null, hap_nodejs_1.Characteristic.LockCurrentState.UNKNOWN);
            });
        });
        this.refresh(mac, service);
    }
}
exports.UnifiKidsCry = UnifiKidsCry;
module.exports = function (homebridge) {
    homebridge.registerPlatform(moduleName, platformName, UnifiKidsCry, true);
};
//# sourceMappingURL=index.js.map