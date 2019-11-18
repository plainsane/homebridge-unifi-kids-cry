import {UBNTClient} from "./ubntClient";
import {
    Access,
    Categories,
    Characteristic,
    CharacteristicEventTypes,
    Service,
    uuid as UUIDGen
} from "hap-nodejs"
const moduleName = "homebridge-unifi-mac-block"
const platformName = "UnifiMacBlocker"
var Accessory;
interface device {
    mac: string
    name: string
    adminControl: boolean|undefined
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
    config: config
    deregister: any[] = []
    updating: Set<string> = new Set()
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
        this.client = new UBNTClient(config.base, config.site, config.username, config.password)
        this.api.on('didFinishLaunching', () => this.finishedLoading())
    }

    configureAccessory(accessory:any) {
      //now del the ole stale shit
      if(this.config.devices.filter((d) => d.mac === accessory.displayName).length === 0) {
        this.deregister.push(accessory)
        this.log(`removing ${accessory.displayName}`)
      } else {
          this.accessories.push(accessory)
          this.bindLockService(accessory.getService("network"), accessory.displayName)
      }
    }

    manageState(service:Service, value:number){
        if (!this.updating.has(service.UUID) && service.getCharacteristic(Characteristic.LockTargetState).value != value) {
          //we need to get out of our handler and rebroadcast since it is possible this value went out a few millis ago but was incorrect
            //basically, someone switches the value in unifi conftroller then we connect to view the device.
          setTimeout(() => service.getCharacteristic(Characteristic.LockTargetState).updateValue(value), 1000)
        }
        service.getCharacteristic(Characteristic.LockCurrentState).updateValue(value);
    }

    refresh(mac: string, service: Service) {
        if(this.refreshInterval === 0) return
        //this.log(`fetching refreshments for ${mac} ${service.updating}`)
        try {
            this.client.isBlocked(mac).then((current) => {
                //this.log(`on callback ${mac} blocked ${current}`)
                let value = current === true ? Characteristic.LockCurrentState.SECURED: Characteristic.LockCurrentState.UNSECURED
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
        let config = new Map<String,device>()
        for(let dev of this.config.devices) {
            config.set(dev.mac, dev)
        }
        this.accessories.forEach((t) => {
          let char = t.getService("network").getCharacteristic(Characteristic.LockTargetState);
          if(config.get(t.displayName).adminControl === true) {
              char.accessRestrictedToAdmins = [Access.WRITE]
          }
          config.delete(t.displayName)
        })

        for(let dev of config.values()) {
          this.createAccessory(dev)
        }
    }

    createAccessory(dev:device) {
        let uuid = UUIDGen.generate(dev.mac);
        const newAccessory = new Accessory(dev.mac, uuid, Categories.DOOR_LOCK);//advertise ourself as a lock
        newAccessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.SerialNumber, dev.mac)
            .setCharacteristic(Characteristic.Manufacturer, "tears incorporated");
        let lockService = newAccessory.addService(Service.LockMechanism, "network")
            .setCharacteristic(Characteristic.Name, dev.name)
        this.bindLockService(lockService, dev.mac)
        lockService.isPrimaryService = true
        this.api.registerPlatformAccessories(moduleName, platformName, [newAccessory]);
        this.log(`added ${dev.name} at mac ${dev.mac}`)
        this.accessories.push(newAccessory)
    }

    bindLockService(service:Service, mac: string) {
        let clazz = this;
        service.getCharacteristic(Characteristic.LockTargetState)
            .on(CharacteristicEventTypes.SET, function (value, callback) {
                clazz.updating.add(service.UUID)
                let result: Promise<0|1>
                if (value === Characteristic.LockTargetState.SECURED) {
                    result = clazz.client.blockMac(mac).then((res)=> res === true ? Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED)
                    let thing = clazz.client.blockMac(mac).then((res)=> res === true ? Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED)
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
                    clazz.updating.delete(service.UUID)
                })
                .catch((shit) => {
                    clazz.log(shit)
                    service.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNKNOWN);
                    callback(null)
                    clazz.updating.delete(service.UUID)
                })
            })
        service.getCharacteristic(Characteristic.LockCurrentState)
            .on(CharacteristicEventTypes.GET, function (callback) {
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
    homebridge.registerPlatform(moduleName, platformName, UnifiKidsCry, true);
}


