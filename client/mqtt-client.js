// sub.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://192.168.0.10')

client.on('connect', () => {
  console.log('Conectado')
  client.subscribe('test', (err) => {
    if (!err) console.log('Suscripto al topic test')
  })
})

client.on('error', (err) => {
    console.error('Error de conexión:', err)
})

client.on('message', (topic, message) => {
  console.log(`Mensaje recibido [${topic}]: ${message.toString()}`)
})
