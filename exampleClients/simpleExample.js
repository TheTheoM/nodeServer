const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');
const deviceBSocket = new WebSocket('ws://localhost:8080');

let moderatorPosition = 0;
let uranium           = 0;
let uraniumAmount     = 0;

// DeviceA outputs an integer 


deviceASocket.addEventListener('open', () => {
    console.log('DeviceA Connected To Server');
    setTimeout(() => {
        deviceASocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceA",
        isNode: true,
        inputNames: [],
        outputNames: ["wordOutput"],
        deviceInfo: "Example Device",
        }))
    }, 500);




})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    console.log(`DeviceA received ${data}`)
})

setInterval(() => {
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
        "wordOutput": "Hello, World!",
        },    
    }))
}, 200);

deviceBSocket.addEventListener('open', () => {
    console.log('DeviceB Connected To Server');

    setTimeout(() => {
        deviceBSocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceB",
        isNode: true,
        inputNames: ["wordInput"],
        outputNames: [],
        deviceInfo: "Device B",
        }))
    }, 500);

    setTimeout(() => {
        deviceASocket.send(JSON.stringify({
            type: "requestPersistentLink",
            outputDeviceName: "DeviceA",
            outputName: "wordOutput",
            inputDeviceName: "DeviceB",
            inputName: "wordInput",
        }))
    }, 1000)
})

deviceBSocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    console.log(`DeviceB received ${data}`)
})



