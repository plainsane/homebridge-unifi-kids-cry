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
    unifios: boolean
    username: string
    password: string
    devices: device[]
}

export class UnifiKidsCry {
    client: UBNTClient
    accessories: any[] = []
    refreshInterval: number
    config: config
    deregister: device[] = []
    constructor(private readonly log: (string) => void, config: config, private api: any) {
        if (!config) {
            return
        }
        this.log = log
        this.api = api
        this.config = config
        this.refreshInterval = config['refreshInterval'];
        if(this.refreshInterval === undefined) this.refreshInterval = 0
        this.refreshInterval = this.refreshInterval * 1000;
        this.client = new UBNTClient(config.base, config.site, config.unifios, config.username, config.password)
        this.api.on('didFinishLaunching', () => this.finishedLoading())
    }

    configureAccessory(accessory) {
      //now del the ole stale shit
      if(this.config.devices.filter((d) => d.mac === accessory.context.mac).length === 0) {
        this.deregister.push(accessory)
        this.log(`removing ${accessory.context.mac}`)
      } else {
          this.accessories.push(accessory)
          this.bindLockService(accessory.getService("network"), accessory.context.mac)
      }
    }

    manageState(service, value){
        if (!service.updating && service.getCharacteristic(Characteristic.LockTargetState).value != value) {
          //we need to get out of our handler and rebroadcast since it is possible this value went out a few millis ago but was incorrect
            //basically, someone switches the value in unifi conftroller then we connect to view the device.
          setTimeout(() => service.getCharacteristic(Characteristic.LockTargetState).updateValue(value), 1000)
        }
        service.getCharacteristic(Characteristic.LockCurrentState).updateValue(value);
    }

    refresh(mac: string, service: any) {
        if(this.refreshInterval === 0) return
        //this.log(`fetching refreshments for ${mac} ${service.updating}`)
        try {
            this.client.isBlocked(mac).then((current) => {
                //this.log(`on callback ${mac} blocked ${current}`)
                let value = current === true ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED
                this.manageState(service, value)
            }).catch((shit) => {
                this.log(shit)
                service.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNKNOWN);
            })
        } catch(err){
            this.log(err)
        }
        setTimeout(() => this.refresh(mac, service), this.refreshInterval)
    }

    finishedLoading() {
        this.api.unregisterPlatformAccessories(moduleName, platformName, this.deregister);
        this.deregister = []
        //add the new hotness
        for(let dev of this.config.devices) {
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
            .setCharacteristic(Characteristic.SerialNumber, dev.mac)
            .setCharacteristic(Characteristic.Manufacturer, "tears incorporated");
        let lockService = newAccessory.addService(Service.LockMechanism, "network")
            .setCharacteristic(Characteristic.Name, dev.name)
        let management = newAccessory.addService(Service.LockManagement, "stuffs");
        this.bindLockManagement(management)
        this.bindLockService(lockService, dev.mac)
        this.api.registerPlatformAccessories(moduleName, platformName, [newAccessory]);
        this.log(`added ${dev.name} at mac ${dev.mac}`)
        this.accessories.push(newAccessory)
    }
    bindLockManagement(lock) {
        lock.setCharacteristic(Characteristic.AdministratorOnlyAccess, true)
        lock.setCharacteristic(Characteristic.Version, "1.0")
        lock.getCharacteristic(Characteristic.LockControlPoint)
            .on('set', function(value, callback) {
                this.log(`lock control point has ${value}`)
                callback()
            })
            .on('get', function(callback){
                this.log(`lock control point get`)
                callback("")
            })
        lock.getCharacteristic(Characteristic.AdministratorOnlyAccess)
            .on('set', function(value, callback) {
                this.log(`lock admin has ${value}`)
                callback()
            })
            .on('get', function(callback){
                this.log(`lock admin get`)
                callback(true)
            })
    }
    bindLockService(service, mac: string) {
        let clazz = this
        service.getCharacteristic(Characteristic.LockTargetState)
            .on('set', function (value, callback) {
                service.updating = true
                let result: Promise<boolean>
                if (value === Characteristic.LockTargetState.SECURED) {
                    result = clazz.client.blockMac(mac).then((res)=> res === true ? Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED)
                } else if (value === Characteristic.LockTargetState.UNSECURED) {
                    result = clazz.client.unblockMac(mac).then((res) => res === true ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED)
                } else {
                    result = clazz.client.isBlocked(mac).then((current) => {
                        clazz.log(`${mac} is in blocked state ${current}`)
                        return (current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED)
                    })
                }
                result.then((want) => {
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(want);
                    callback(null)
                    service.updating = false
                })
                .catch((shit) => {
                    clazz.log(shit)
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null)
                    service.updating = false
                })
            })
        service.getCharacteristic(Characteristic.LockCurrentState)
            .on('get', function (callback) {
                clazz.client.isBlocked(mac).then((current) =>{
                    clazz.log(`${mac} blocked ${current}`)
                    let value = current === true ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED
                    clazz.manageState(service, value)
                    callback(null, value)
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


