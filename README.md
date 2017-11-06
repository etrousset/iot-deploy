# iot-deploy

Tools to deploy a simple IoT environment to your Kuzzle.

Edit info in `config/default.json` to specify where to find your Kuzzle.

Launch `node k_iot_init.js` to create an iot index with base collections to handle your devices.

This work is a early stage WIP

## Collections
| Collection | Usage |
|------------|:----------|
| device-state | This collection stores the state of the devices |
| device-info | This collection is where to store static information about the device (user it belongs to, current firmware version, friendly name...) |
| firmware-update | This collection allow handling firmware updates for devices |


### Device state mapping
```
{
  "device_id" : "an UID that identify the device the state represents",
  "device_type": "An ID that identity the kind of device at hardware level",
  "state" : {
      "Set of properties that represents the current state of the device."
      }
}
```
### Other collection

Other collection are free to use for now, this might change...
