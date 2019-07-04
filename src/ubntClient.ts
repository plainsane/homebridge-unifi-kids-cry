import * as restm from 'typed-rest-client/RestClient';
import {IHeaders, IRequestOptions} from "typed-rest-client/Interfaces";

interface UBNTMeta {
    rc: String
    up: Boolean
    server_version: String
    uuid: String
}

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


class UBNTClient {
    baseOpts:IRequestOptions
    client:restm.RestClient
    constructor(base: String, user:String, password:String){
        this.baseOpts = {
            ignoreSslError: true
        }
        this.client = new restm.RestClient('typed-rest-client-tests', 'https://ftp:8443', undefined, baseOpts);

    }

    async function login() {

    }
}