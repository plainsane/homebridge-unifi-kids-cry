import * as restm from 'typed-rest-client/RestClient';
import {IRequestOptions} from "typed-rest-client/Interfaces";

interface UBNTLogin {
    username: String
    password: String
}

interface UBNTMac {
    mac: String
}

const baseOpts:IRequestOptions = {
    ignoreSslError: true
}

export class UBNTClient {
    client:restm.RestClient
    auth: UBNTLogin
    site: String
    constructor(base: String, site:String, user:String, password:String) {
        this.auth = {
            username: user,
            password: password
        }
        this.site = site
        this.client = new restm.RestClient('typed-rest-client-__tests__', base as string, undefined, baseOpts);
    }

    async login() {
        let resp = await this.client.create("/api/login", this.auth)
        let cookies = resp.headers['set-cookie']
        let reqOpts:restm.IRequestOptions = {
            additionalHeaders:  {cookie: cookies}
        }
        return reqOpts
    }
    async blockMac(mac:String) {
        let data:UBNTMac = {mac: mac}
        let auth = await this.login()
        return await this.client.create(`/api/s/${this.site}/cmd/stamgr/block-sta`, data, auth)
    }

    async unblockMac(mac:String) {
        let data:UBNTMac = {mac: mac}
        let auth = await this.login()
        return await this.client.create(`/api/s/${this.site}/cmd/stamgr/unblock-sta`, data, auth)
    }

    async isBlocked(mac:String) {
        let data:UBNTMac = {mac: mac}
        let auth = await this.login()
        return await this.client.update(`/api/s/${this.site}/stat/device`, data, auth)
    }
}
