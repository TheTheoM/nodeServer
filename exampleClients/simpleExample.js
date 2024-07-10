const WebSocket = require("ws")



// Connect two devices to Server
const deviceASocket = new WebSocket('ws://localhost:8080');
const deviceBSocket = new WebSocket('ws://localhost:8080');


deviceASocket.addEventListener('open', () => {
    console.log('DeviceA Connected To Server');
    // Sending Registration Message
    deviceASocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceA",
        isNode: true,
        inputNames: ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo: "Example Device",
    }))
})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    // console.log("DeviceA Received  message: ")
    // console.log(data)

    if (data.type === "sendInputs") {
        if (data.inputs.hasOwnProperty("wordInput")) {
            console.log(`DeviceA received input from input: "wordInput": ${data.inputs.wordInput}`)
        }
    } 
})

deviceBSocket.addEventListener('open', () => {
    console.log('DeviceB Connected To Server');
    deviceBSocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceB",
        isNode: true,
        inputNames: ["wordInput"],
        outputNames: ["wordOutput"],
        deviceInfo: "Device B",
    }))
})

deviceBSocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    // console.log("DeviceB Received  message: ")
    // console.log(data)
    if (data.type === "sendInputs") {
        if (data.inputs.hasOwnProperty("wordInput")) {
            console.log(`DeviceB received input from input: "wordInput": ${data.inputs.wordInput}`)
        }
    } 
})


// After one second, request the server to connect DeviceA's output to DeviceB's input. 

// NOTE: The link generated by 'requestLink' will become invalid upon device disconnection. For a persistent link
//       that survives disconnection and server power-cycling, utilize `type: 'requestPersistentLink'`.
//       This type of link is established when both devices are online.


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

setInterval(() => {
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "wordOutput": "Hello, World!",
        },    
    }))
}, 200);
