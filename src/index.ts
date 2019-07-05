import {UBNTClient} from "./ubntClient";
import {UnifiKidsCry} from "./platform";

var Accessory, Service, Characteristic, UUIDGen;

async function doit() {
    let client = new UBNTClient('https://ftp:8443', "default",'api', 'Plainsane8000')
    let foo = await client.isBlocked("4c:bb:58:cd:5b:77")
    console.log(JSON.stringify(foo))
    //await client.blockMac("4c:bb:58:cd:5b:77")
    //await client.unblockMac("4c:bb:58:cd:5b:77")
    return undefined
}

module.exports = function(homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform("homebridge-unifi-kids-cry", "UnifiMacBlocker", UnifiKidsCry, true);
}


doit()