import {UBNTClient} from "./ubntClient";

var Accessory, Service, Characteristic, UUIDGen;

const moduleName = "homebridge-unifi-mac-block"
const platformName = "UnifiMacBlocker"
interface device {
    mac: string
    name: string
}
interface config {
    base: string
    site: string
    username: string
    password: string
    devices: device[]
}

export class UnifiKidsCry {
    client: UBNTClient
    accessories: any[] = []
    refreshInterval: number
    constructor(private readonly log: (string) => void, config: config, private api: any) {
        if (!config) {
            return
        }
        this.log = log
        this.api = api
        this.refreshInterval = config['refreshInterval'] || 5;
        this.refreshInterval = this.refreshInterval * 1000;
        this.client = new UBNTClient(config.base, config.site, config.username, config.password)
        this.api.on('didFinishLaunching', () => this.finishedLoading(config))
    }

    configureAccessory(accessory) {
        this.accessories.push(accessory)
        this.bindLockService(accessory.getService("network"), accessory.context.mac)
    }

    refresh(mac: string, service: any) {
        this.log(`fetching refreshments for ${mac}`)
        this.client.isBlocked(mac).then((current) =>{
            this.log(`on callback ${mac} blocked ${current}`)
            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED);
        }).catch((shit) =>{
            this.log(shit)
            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
        })
        setTimeout(() => this.refresh(mac, service), this.refreshInterval)

    }

    finishedLoading(config: config) {
        //now del the ole stale shit
        for(let acc of this.accessories) {
            if(config.devices.filter((d) => d.mac === acc.context.mac).length === 0) {
                this.log(`removing ${acc.context.mac}`)
                this.api.unregisterPlatformAccessories(moduleName, platformName, [acc]);
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
        const newAccessory = new Accessory(dev.mac, uuid);
        newAccessory.context.mac = dev.mac
        newAccessory.reachable = true;
        newAccessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.SerialNumber, dev.mac);
        let lockService = newAccessory.addService(Service.LockMechanism, "network")
        newAccessory.addService(Service.LockManagement, 'admin')
            .setCharacteristic(Characteristic.AdministratorOnlyAccess, true);
        this.bindLockService(lockService, dev.mac)
        this.api.registerPlatformAccessories(moduleName, platformName, [newAccessory]);
        this.log(`added ${dev.name} at mac ${dev.mac}`)
    }

    bindLockService(service, mac: string) {
        let clazz = this
        service.getCharacteristic(Characteristic.LockTargetState)
            .on('set', function (value, callback) {
                clazz.log('now we are setting some shit')
                if (value === Characteristic.LockTargetState.SECURED) {
                    clazz.client.blockMac(mac)
                        .then(() => {
                            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockTargetState.SECURED);
                            callback(null)
                        })
                        .catch((shit) => {
                            clazz.log(shit)
                            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                            callback(null)
                        })
                } else if (value === Characteristic.LockTargetState.UNSECURED) {
                    clazz.client.unblockMac(mac)
                        .then(() => {
                            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockTargetState.UNSECURED);
                            callback(null)
                        })
                        .catch((shit) => {
                            clazz.log(shit)
                            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                            callback(null)
                        })
                } else {
                    clazz.log(`a lock state of ${value} was requested on mac ${mac} but this is unsupported`)
                    clazz.client.isBlocked(mac).then((current) =>{
                        clazz.log(`${mac} is in blocked state ${current}`)
                        service.getCharacteristic(Characteristic.LockCurrentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED);
                        callback(null)
                    }).catch((shit) =>{
                        clazz.log(shit)
                        service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                        callback(null, Characteristic.LockCurrentState.UNKNOWN)
                    })
                }

            })
        service.getCharacteristic(Characteristic.LockCurrentState)
            .on('get', function (callback) {
                clazz.client.isBlocked(mac).then((current) =>{
                    clazz.log(`${mac} blocked ${current}`)
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED);
                    callback(null, current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED)
                }).catch((shit) =>{
                    clazz.log(shit)
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null, Characteristic.LockCurrentState.UNKNOWN)

                })
            })
        this.refresh(mac, service)
    }
}

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform(moduleName, platformName, UnifiKidsCry, true);
}


