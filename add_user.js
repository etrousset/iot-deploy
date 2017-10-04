var Kuzzle = require('kuzzle-sdk')
var config = require('./config/default.json')
var Enquirer = require('enquirer')
var k_cfg = config.kuzzle

var enquirer = new Enquirer()

var user_questions = [
  {
    name: 'forname',
    message: 'Forname: ',
    default: 'John'
  },
  {
    name: 'surname',
    message: 'Surname: ',
    default: 'Doe'
  },
  {
    name: 'email',
    message: 'email: ',
    default: 'john.doe@kuzzle.io'
  }  
]

var kuzzle = new Kuzzle(k_cfg.host, {defaultIndex: k_cfg.index},
  () => {
    kuzzle.loginPromise('local', k_cfg.user, '1d')
      .then( () => enquirer.ask(user_questions))
      .then(user_data => {
        kuzzle.collection('users').createDocumentPromise(
          {
            forname: user_data.forname,
            surname: user_data.surname,
            email: user_data.email
          })
      })
      .catch(err => console.log(err))
      .then(() => kuzzle.disconnect())
  })
