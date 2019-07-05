import {UBNTClient} from "./ubntClient";

class UnifiKidsCry {
    client: UBNTClient
    constructor(private log: (string) => void, config: {}, private api: any) {
        if(config === undefined) {
            return
        }
        this.log = log
        this.api = api
        //this.client = new UBNTClient('https://ftp:8443', "default",'api', 'Plainsane8000')
        this.client = new UBNTClient(config.endpoint, config.site,config.username, config.password)
    }

    configureAccessory(accessory) {

    }
}