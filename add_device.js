var Kuzzle = require('kuzzle-sdk') 
var config = require('./config/default.json')
const util = require('util')

var Enquirer = require('enquirer')
var enquirer = new Enquirer()
 
enquirer.register('radio', require('prompt-radio'))
enquirer.register('list', require('prompt-list'))
enquirer.register('confirm', require('prompt-confirm'))

var users = []

var questions = [
  {
    name: 'device_name',
    message: 'Device friendly name: ',
    type: 'input',
    default: 'my sensor'
  },
  {
    name: 'device_type',
    message: 'Device friendly name: ',
    type: 'list',
    choices: ['k-sensor', 'other...'],
    default: 'k-sensor'
  },
  {
    name: 'location',
    message: 'What is the location of the device(home, work...) ? ',
    type: 'input',
    default: 'home'
  },
  {
    name: 'sub_loc',
    message: 'What is the fine location of the device (kitchen, bedroom, ...) ? ',
    type: 'input',
    default: 'batcave'
  },
  {
    name: 'use_geo_loc',
    type: 'confirm',
    message: 'Do you want to geolocalize your device ?',
    default: false
  },
]

var geo_loc_question = [
  {
    name: 'lon',
    message: 'Longitude: ',
    type: 'input'
  },
  {
    name: 'lat',
    message: 'Latitude: ',
    type: 'input'
  }
]

var user_question = [
  {
    name: 'user_id',
    message: 'Which user do you want this device to be associated with: ',
    type: 'list',
    choices: users
  }
]

var device_id_question = [
  {
    name: 'device_id',
    message: 'Device ID (from the hardware device): ',
    type: 'input'
  }
]


var kuzzle_cfg = config.kuzzle
var kuzzle = new Kuzzle('localhost', {defaultIndex: kuzzle_cfg.index}, () => {
  kuzzle.loginPromise('local', kuzzle_cfg.user, '1d')
    .then(() => kuzzle.collection('users').searchPromise({}, {}) ) // -- get a list of users from data base -- //
    .then(searchResult => {
      searchResult.getDocuments()
        .forEach(doc => users.push(
          {
            name: util.format('%s - %s %s (%s)', doc.id, doc.content.forname, doc.content.surname, doc.content.email),
            uname: doc.content.name,
            id: doc.id
          }
        ))
    })
    .then(()=> enquirer.ask(questions))
    .then(ans => ans.use_geo_loc ? enquirer.ask(geo_loc_question) : undefined)
    .then(()=> enquirer.ask(user_question))
    .catch(err => console.log('catch2: \n', err, 'Users: \n', users))
    .then(devinfo => {
      // -- need to path user result as inquirer doesn't give us back the full selected object (wtf???) --
      devinfo.user_id = devinfo.user_id.split(' - ')[0]
      return devinfo
    })
    .then(() => enquirer.ask(device_id_question))
    .then((devinfo) => {
      return kuzzle.collection('device-info').createDocumentPromise(
        {
          device_type: devinfo.device_type,
          friendly_name: devinfo.device_name,
          geo_loc: devinfo.use_geo_loc ? {lat: devinfo.lat, lon: devinfo.lon} : undefined,
          id: devinfo.device_id, // TODO: get the device id from the device itself...
          location: devinfo.location,
          sub_loc: devinfo.sub_loc,
          user_id: devinfo.user_id,
        }
      )
    })
    .catch(err => console.log('Error during document creation:\n', err)) 
    .then(() => kuzzle.disconnect())
})