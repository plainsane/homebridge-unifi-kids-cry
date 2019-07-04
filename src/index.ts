import * as ubnt from "ubntClient"

async function doit() {
    let client = ubnt.UBNTClient('https://ftp:8443', 'api', 'Plainsane8000')

    let shitShit = await _rest.create("/api/s/default/cmd/stamgr/block-sta", mac, reqOpts)
    console.log(JSON.stringify(shitShit))
    await new Promise(resolve=>{
        setTimeout(resolve,30000)
    })
    let shitShitShit = await _rest.create("/api/s/default/cmd/stamgr/unblock-sta", mac, reqOpts)
}

doit()
