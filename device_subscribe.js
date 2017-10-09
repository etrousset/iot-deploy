var Kuzzle = require('kuzzle-sdk') 
var config = require('./config/default.json')

var Enquirer = require('enquirer')
var enquirer = new Enquirer()
 
enquirer.register('radio', require('prompt-radio'))
enquirer.register('list', require('prompt-list'))
enquirer.register('confirm', require('prompt-confirm'))



var kuzzle_cfg = config.kuzzle
var kuzzle = new Kuzzle('localhost', {defaultIndex: kuzzle_cfg.index}, () => {
  kuzzle.loginPromise('local', kuzzle_cfg.user, '1d')
    .then(() => {
      kuzzle.collection('devices', 'iot').subscribe({equals: {device_id:'30AEA400C595' }}, {subscribeToSelf: false}, (err, res) => {
        if(res.document.content.value == 1.0) {
          console.log('Motion detected => Turning light on')
          kuzzle.collection('devices', 'iot').document({device_id: '30AEA480838D', state: { on: true}}).publish()
          // .catch(()=> console.log('Failed to publish light document'))
        } else {
          console.log('No more motion detected => Turning light off')
          kuzzle.collection('devices', 'iot').document({device_id: '30AEA480838D', state: { on: false}}).publish()
          // .catch(()=> console.log('Failed to publish light document'))
        }
      })
    }) 
    .then(()=> console.log('Subscribed to PIR motion events'))
    .catch(err => console.log('Error during document creation:\n', err)) 
})

kuzzle.on('disconnect', () => console.log('Kuzzle disconnected'))
