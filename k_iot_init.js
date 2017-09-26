var Kuzzle = require('kuzzle-sdk') 
var fs = require('fs')
var config = require('./config/default.json')

var kuzzle_cfg = config.kuzzle

const IOT_COLLECTIONS =
            ['users', 'fw-updates', 'sensor-states', 'sensor-info']

var kuzzle = new Kuzzle('localhost', {defaultIndex: kuzzle_cfg.index}, () => {
  kuzzle.loginPromise('local', kuzzle_cfg.user, '1d')
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
