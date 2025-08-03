const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');

let i = 0

deviceASocket.addEventListener('open', () => {
    console.log('DeviceA Connected To Server');
    deviceASocket.send(JSON.stringify({
        type:        "registerDevice",
        name:        "DeviceA",
        isNode:      true,
        inputNames:  ["Input_1", "Input_2"],
        outputNames: ["Output_1", "Output_2"],
        deviceInfo:  "Example Device",
    }))
})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    if (data.type === "sendInputs") {
        if (data.inputs === "Input_1") {
            console.log(`Input_1 received Data: ${data.inputs.wordInput}`)

        } else if (data.inputs === "Input_2") {
            console.log(`Input_2 received Data: ${data.inputs.wordInput}`)
        }
    } 
})

setInterval(() => {
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "Output_1": "Hello, World? Maybe Device B is my world?",
            "Output_2": i,
        },    
    }))
    i++
}, 200);