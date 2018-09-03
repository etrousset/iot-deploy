var Kuzzle = require('kuzzle-sdk')
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"))
var Enquirer = require('enquirer')
var enquirer = new Enquirer()

enquirer.register('radio', require('prompt-radio'))
enquirer.register('list', require('prompt-list'))
enquirer.register('confirm', require('prompt-confirm'))
enquirer.register('password', require('prompt-password'))

const IOT_COLLECTIONS = ['fw-updates', 'device-state', 'device-info']

function get_configs() {
  console.log("hello")
  return fs.readdirAsync('config')
}
console.log('pif')
get_configs()
  .then((configs) => {
    var config_question = [{
      name: 'config',
      message: 'Which configuration: ',
      type: 'list',
      choices: configs
    }]

    return enquirer.ask(config_question)
  })
  .then((resp) => {
    var config = require('./config/' + resp.config)
    return config.kuzzle
  })
  .then((kuzzle_cfg => {
    var kuzzle = new Kuzzle(kuzzle_cfg.host, {
      defaultIndex: kuzzle_cfg.index
    }, () => {
      kuzzle.loginPromise('local', kuzzle_cfg.user, '1d')
        .catch((e) => {
          console.log('Login with config password error: ', e.message)
          var config_question = [{
            name: 'password',
            message: 'Admin password: ',
            type: 'password',
          }]

          return enquirer.ask(config_question)
            .then(r => {
              return kuzzle.loginPromise('local', {
                  username: kuzzle_cfg.user.username,
                  password: r.password
                },
                '1d')
            })
        })
        .catch((e) => {
          console.log('Login error: ', e.message)
          process.exit(-1)
        })
        .then(() => kuzzle.createIndexPromise(kuzzle_cfg.index))
        .then(() => console.log(`Index '${kuzzle_cfg.index}' created...`))
        .catch(() => console.log(`Index '${kuzzle_cfg.index}' already exists`))
        .then(() => {
          const promises = []
          IOT_COLLECTIONS.forEach(col_name => {
            promises.push(
              kuzzle.listCollectionsPromise()
              .then(collections => {
                if (!collections.find(elem => elem.name === col_name)) {
                  console.log(
                    `[${col_name}] Collection needs to be created`)

                  return kuzzle.collection(col_name).createPromise()
                    .then(() => {
                      console.log(`[${col_name}] Collection created`)
                      return kuzzle.collection(col_name)
                    })
                } else {
                  console.log(`[${col_name}] Collection already exists`)
                  return kuzzle.collection(col_name)
                }
              })
              .catch((err) => {
                console.log('Failed to create collection: \n', err)
              })
              .then(collection => {
                console.log(
                  `[${col_name}] Setting mapping for collection`)
                var contents = fs.readFileSync(`mappings/${col_name}.json`)
                var jsonContent = JSON.parse(contents)

                return collection.collectionMapping(jsonContent)
                  .applyPromise()
                  .then(() => console.log(`[${col_name}] Mapping set`))
                  .catch(err => {
                    console.log('/!\\ Error applying mapping:\n', err)
                  })
              })
              .catch(err => {
                console.log('Error while trying to set mapping for collection:\n', err)
              })
            )
          })
          return Promise.all(promises)
        })
        .catch()
        .then(() => {
          kuzzle.disconnect()
          console.log('[DONE] Your IoT environement is ready to use...')
        })
    })
  }))