import * as restm from 'typed-rest-client/RestClient';
interface UBNTLogin {
    username: String;
    password: String;
}
export declare class UBNTClient {
    client: restm.RestClient;
    auth: UBNTLogin;
    site: String;
    constructor(base: String, site: String, user: String, password: String);
    login(): Promise<restm.IRequestOptions>;
    blockMac(mac: String): Promise<boolean>;
    unblockMac(mac: String): Promise<boolean>;
    isBlocked(mac: String): Promise<boolean>;
}
export {};
//# sourceMappingURL=ubntClient.d.ts.map