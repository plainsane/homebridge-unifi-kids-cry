import {UBNTClient} from "./ubntClient";

var Accessory, Service, Characteristic, UUIDGen;

interface device {
    mac: string
    name: string
}
interface config {
    endpoint: string
    site: string
    username: string
    password: string
    devices: device[]
}

export class UnifiKidsCry {
    client: UBNTClient
    accessories: any[] = []
    constructor(private log: (string) => void, config: config, private api: any) {
        if (config === undefined) {
            return
        }
        this.log = log
        this.api = api
        this.client = new UBNTClient(config.endpoint, config.site, config.username, config.password)
        this.api.on('didFinishLaunching', () => this.finishedLoading(config))
    }

    configureAccessory(accessory) {
        this.accessories.push(accessory)
        this.bindService(accessory.getService("network"), accessory.context.mac)
    }

    finishedLoading(config: config) {
        //now del the ole stale shit
        console.log(JSON.stringify(this.accessories))
        for(let acc of this.accessories) {
            if(config.devices.filter((d) => d.mac === acc.context.mac).length === 0) {
                this.log(`removing ${acc.context.mac}`)
                this.api.unregisterPlatformAccessories("homebridge-unifi-kids-cry", "UnifiMacBlocker", [acc]);
            }
        }
        //add the new hotness
        for(let dev of config.devices) {
            if(this.accessories.filter((t) => t.context.mac === dev.mac).length === 0){
                this.createAccessory(dev)
            }
        }
    }

    createAccessory(dev:device) {
        let uuid = UUIDGen.generate(dev.mac);
        var newAccessory = new Accessory(dev.mac, uuid);
        newAccessory.context.mac = dev.mac
        newAccessory.reachable = true;
        newAccessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.SerialNumber, dev.mac);
        let service = newAccessory.addService(Service.LockMechanism, "network")
        this.bindService(service, dev.mac)
        this.api.registerPlatformAccessories("homebridge-unifi-kids-cry", "UnifiMacBlocker", [newAccessory]);
        this.log(`added ${dev.name} at mac ${dev.mac}`)
    }

    bindService(service, mac: string) {
        service.getCharacteristic(Characteristic.LockTargetState)
            .on('set', function (value, callback) {
                if (value === Characteristic.LockCurrentState.SECURED) {
                    this.client.blockMac(mac)
                        .then(() => callback(null))
                        .catch((shit) => {
                            this.log(shit)
                            service.getCharacteristic(Characteristic.LockCurentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                            callback(null)
                        })
                } else if (value === Characteristic.LockCurrentState.UNSECURED) {
                    this.client.unblockMac(mac)
                        .then(() => callback(null))
                        .catch((shit) => {
                            this.log(shit)
                            service.getCharacteristic(Characteristic.LockCurentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                            callback(null)
                        })
                } else {
                    this.log(`a lock state of ${value} was requested on mac ${mac} but this is unsupported`)
                    this.client.isBlocked(mac).then((current) =>{
                        service.getCharacteristic(Characteristic.LockCurentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED);
                        callback(null)
                    }).catch((shit) =>{
                        service.getCharacteristic(Characteristic.LockCurentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                        callback(null, Characteristic.LockCurrentState.UNKNOWN)

                    })
                }

            })
        service.getCharacteristic(Characteristic.LockCurrentState)
            .on('get', function (value, callback) {
                this.client.isBlocked(mac).then((current) =>{
                    this.log(`${mac} blocked ${current}`)
                    service.getCharacteristic(Characteristic.LockCurentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED);
                    callback(null, current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED)
                }).catch((shit) =>{
                    service.getCharacteristic(Characteristic.LockCurentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null, Characteristic.LockCurrentState.UNKNOWN)

                })
            })
    }
}

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform("homebridge-unifi-kids-cry", "UnifiMacBlocker", UnifiKidsCry, true);
}


