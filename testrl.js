const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

new Promise( resolve => {
  rl.question('Will this quit the runloop??? ', ans => resolve(ans))
})
  .then(ans => {
    console.log('Answer is: ', ans)
    rl.close()
  })
