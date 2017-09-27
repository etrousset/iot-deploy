var Kuzzle = require('kuzzle-sdk')
var config = require('./config/default.json')
var Readline = require('readline')

var k_cfg = config.kuzzle

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

var kuzzle = new Kuzzle(k_cfg.host, {defaultIndex: k_cfg.index},
  () => {
    kuzzle.loginPromise('local', k_cfg.user, '1d')
      .then( () => {
        return new Promise(resolve => {
          rl.question('User name: ', user_name => resolve(user_name))
        })
      })
      .then(user_name => kuzzle.collection('users').createDocumentPromise({name: user_name}))
      .catch(err => console.log(err))
      .then((res) => {console.log(res);rl.close(); kuzzle.disconnect()})
  })
