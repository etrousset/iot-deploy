var Kuzzle = require('kuzzle-sdk')
var config = require('./config/default.json')
var Readline = require('readline')

var k_cfg = config.kuzzle

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.on('close', () => console.log('readline closed'));

var kuzzle = new Kuzzle(k_cfg.host, {defaultIndex: k_cfg.index},
  () => {
    kuzzle.loginPromise('local', k_cfg.user, '1d')
      .then( () => {
        return new Promise(resolve => {
          rl.question('User name: ', user_name => resolve(user_name))
        })
      })
      .then(uname => console.log('uname = ', uname))
      //.then(user_name => kuzzle.collection('users').createDocumentPromise({name: user_name}))
      .catch()
      .then(() => {rl.close(); kuzzle.disconnect(); process.exit(0); console.log('Done')})
  })
