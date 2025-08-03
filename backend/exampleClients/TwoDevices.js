const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');

deviceASocket.addEventListener('open', () => {
    console.log('DeviceA Connected To Server');
    deviceASocket.send(JSON.stringify({
        type:        "registerDevice",
        name:        "DeviceA",
        isNode:      true,
        inputNames:  ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo:  "Example Device",
    }))
})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    if (data.type === "sendInputs") {
        if (data.inputs.hasOwnProperty("wordInput")) {
            console.log(`DeviceA received input from input: "wordInput": ${data.inputs.wordInput}`)
        }
    } 
})

setInterval(() => {
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "wordOutput": "Hello, World? Maybe Device B is my world?",
        },    
    }))
}, 200);

const deviceBSocket = new WebSocket('ws://localhost:8080');

deviceBSocket.addEventListener('open', () => {
    console.log('DeviceB Connected To Server');
    deviceBSocket.send(JSON.stringify({
        type:        "registerDevice",
        name:        "DeviceB",
        isNode:      true,
        inputNames:  ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo:  "Device B",
    }))
})

deviceBSocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    if (data.type === "sendInputs") {
        if (data.inputs.hasOwnProperty("wordInput")) {
            console.log(`DeviceB received input from input: "wordInput": ${data.inputs.wordInput}`)
        }
    } 
})


// After one second, request the server to connect DeviceA's output to DeviceB's input. 

// setTimeout(() => {
//     deviceASocket.send(JSON.stringify({
//         type:             "requestLink",
//         outputDeviceName: "DeviceA",
//         outputName:       "wordOutput",
//         inputDeviceName:  "DeviceB",
//         inputName:        "wordInput",
//     }))
// }, 1000)

// Device A continuously sends "Hello, World!" as output, which the server will route to device B.

