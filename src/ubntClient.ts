import * as restm from 'typed-rest-client/RestClient';
import {IRequestOptions} from "typed-rest-client/Interfaces";

interface UBNTLogin {
    username: String
    password: String
}

interface UBNTMac {
    mac: String
}

interface UBNTClientData {
    blocked:boolean
}

interface UBNTClientResponse {
    meta: Object
    data: UBNTClientData[]
}

const baseOpts:IRequestOptions = {
    ignoreSslError: true
}

export class UBNTClient {
    client:restm.RestClient
    auth: UBNTLogin
    site: String
    unifios: Boolean
    constructor(base: String, site:String, unifios:Boolean, user:String, password:String) {
        this.auth = {
            username: user,
            password: password
        }
        this.site = site
        this.unifios = unifios
        this.client = new restm.RestClient('typed-rest-client-__tests__', base as string, undefined, baseOpts);
    }

    async login() {
        let resp = await this.client.create(this.unifios ? "/api/auth/login" : "/api/login", this.auth)
        let cookies = resp.headers['set-cookie']
        let reqOpts:restm.IRequestOptions = {
            additionalHeaders:  {cookie: cookies}
        }
        return reqOpts
    }
    async blockMac(mac:String):Promise<boolean> {
        let data:UBNTMac = {mac: mac}
        let auth = await this.login()
        let res = await this.client.create(`${this.unifios ? "/network/proxy" : ""}/api/s/${this.site}/cmd/stamgr/block-sta`, data, auth)
        return res.statusCode === 200
    }

    async unblockMac(mac:String):Promise<boolean> {
        let data:UBNTMac = {mac: mac}
        let auth = await this.login()
        let res = await this.client.create(`${this.unifios ? "/network/proxy" : ""}/api/s/${this.site}/cmd/stamgr/unblock-sta`, data, auth)
        return res.statusCode === 200
    }

    async isBlocked(mac:String):Promise<boolean> {
        let auth = await this.login()
        let ret = await this.client.get<UBNTClientResponse>(`${this.unifios ? "/network/proxy" : ""}/api/s/${this.site}/stat/user/${mac}`, auth)
        return ret.result.data[0].blocked
    }
}
