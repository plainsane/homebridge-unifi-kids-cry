import { UBNTClient } from "./ubntClient";
import { Service } from "hap-nodejs";
interface device {
    mac: string;
    name: string;
    adminControl: boolean | undefined;
}
interface config {
    base: string;
    site: string;
    username: string;
    password: string;
    devices: device[];
}
export declare class UnifiKidsCry {
    private readonly log;
    private api;
    client: UBNTClient;
    accessories: any[];
    refreshInterval: number;
    config: config;
    deregister: any[];
    updating: Set<string>;
    constructor(log: (string: any) => void, config: config, api: any);
    configureAccessory(accessory: any): void;
    manageState(service: Service, value: number): void;
    refresh(mac: string, service: Service): void;
    finishedLoading(): void;
    createAccessory(dev: device): void;
    bindLockService(service: Service, mac: string): void;
}
export {};
//# sourceMappingURL=index.d.ts.map