# homebridge-unifi-mac-block
## The name
i originally named this repo cause my kids will sometimes act like anal crevises which would force me to block their playstations in my unifi controller.  The progressed to my wife calling me to do this during the day.  Well no more
i have exposed the mac through homekit as a pad lock.

## Configuration
Create a user in your unifi controller, it does not need the elevated permissions to manage devices.

A sample config is located in [config.json](homebridge/config.json) which can be used to specify the platform for this functionality.
````json
  "base":"<the url to your unifi controller",
  "username": "<an admin user name>",
  "password": "<duh>",
  "refreshInterval": "<seconds to requery for state changes>"
  "site": "<the uuid of the site or 'default'>",
  "devices": [
    {
      "name": "<currently not impleted but required, sorry>",
      "mac": "00:00:00:00:00:00"
    }
  ]
````
to install
```bash
npm i -g homebridge-unifi-mac-block
```
then update the homebridge config to include the platform definition shown in [config.json](homebridge/config.json).
