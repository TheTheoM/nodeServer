const WebSocket = require("ws")

const deviceBSocket = new WebSocket('ws://localhost:8080');

let i = 0

deviceBSocket.addEventListener('open', () => {
    console.log('deviceB Connected To Server');
    deviceBSocket.send(JSON.stringify({
        type:        "registerDevice",
        name:        "deviceB",
        isNode:      true,
        inputNames:  {"Input_1": "str", "Input_2": "float"},
        outputNames: {"Output_1": "str", "Output_2": "int"},
        deviceInfo:  "Example Device",
    }))
    // string, float, int, boolean, array, typeless
})

deviceBSocket.addEventListener("message", (msg) => {
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
    deviceBSocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "Output_1": "World? Do you ever respond?",
            "Output_2": i,
        },    
    }))
    i++
}, 200);