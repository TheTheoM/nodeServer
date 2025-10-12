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
    // console.log(data)

    if (data.type === "sendInputs") {
        Object.keys(data.inputs).forEach((inputName) => {
            if (inputName === "Input_1") {
                console.log(`Input_1 received Data: ${data.inputs[inputName]}`)
            } else if (inputName === "Input_2") {
                console.log(`Input_2 received Data: ${data.inputs[inputName]}`)
            }
        })
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