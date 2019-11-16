import { UBNTClient } from "./ubntClient";
import { Accessory, Service } from "hap-nodejs";
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
    accessories: Accessory[];
    refreshInterval: number;
    config: config;
    deregister: Accessory[];
    updating: Set<string>;
    constructor(log: (string: any) => void, config: config, api: any);
    configureAccessory(accessory: Accessory): void;
    manageState(service: Service, value: number): void;
    refresh(mac: string, service: Service): void;
    finishedLoading(): void;
    createAccessory(dev: device): void;
    bindLockService(accessory: Accessory, service: Service, mac: string): void;
}
export {};
//# sourceMappingURL=index.d.ts.map