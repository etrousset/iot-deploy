var Kuzzle = require('kuzzle-sdk')
var config = require('./config/default.json')
var fs = require('fs')
var k_cfg = config.kuzzle

var Enquirer = require('enquirer')
var enquirer = new Enquirer()
 
enquirer.register('radio', require('prompt-radio'))
enquirer.register('list', require('prompt-list'))
enquirer.register('confirm', require('prompt-confirm'))

var firmware_questions = [
  {
    name: 'target',
    message: 'Firmware target:',
    type:'list',
    choices: ['k-pir-motion', 'k-rgb-light', 'k-ww-light', 'k-cw-light'],
    default: 'k-rgb-light'

  },
  {
    name: 'version',
    message: 'Firmware verion: ',
    type: 'input',
    default: '1.0.0'
  },
  {
    name: 'filename',
    message: 'Filename: ',
    type: 'list',
    default: 'k-light-0.9.0-9451b10.bin'
  }  
]

new Promise((resolve, reject) => {
  fs.readdir('/home/etrousset/demo_awox/fw/', function(err, items) {
    if(err)
      return reject(err)

    firmware_questions[2].choices = items
    return resolve()
  })
})
  .catch(err => console.log(err))


var kuzzle = new Kuzzle(k_cfg.host, {defaultIndex: k_cfg.index},
  () => {
    kuzzle.loginPromise('local', k_cfg.user, '1d')
      .then( () => enquirer.ask(firmware_questions))
      .then(fw_data => {
        return kuzzle.collection('fw-updates', 'iot-3').createDocumentPromise(
          {
            target: fw_data.target,
            version:  {
              major: Number.parseInt(fw_data.version.split('.')[0]),
              minor: Number.parseInt(fw_data.version.split('.')[1]),
              patch: Number.parseInt(fw_data.version.split('.')[2])
            },
            dl: {
              ip: '10.34.50.114',
              port: '2354',
              path: fw_data.filename
            }
          })
      })
      .catch(err => console.log(err))
      .then(() => kuzzle.disconnect())
  })
