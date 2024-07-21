const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');

let i = 0

deviceASocket.addEventListener('open', () => {
    console.log('DeviceA Connected To Server');
    deviceASocket.send(JSON.stringify({
        type:        "registerDevice",
        name:        "Widgetia",
        isNode:      true,
        inputNames:  ["Input_1", "Input_2"],
        outputNames: ["Output_1", "Output_2"],
        deviceInfo:  "Example Device",
        widgets: [
            {
                widgetName: "widgetSlider",
                value: "1",
                widgetType: "slider",
                values: ["1", "100"],
            },
            {
                widgetName: "aToggleSwitch",
                value: "World",
                widgetType: "toggle",
                values: ["Hello", "World"],
            }
        ],
    }))
})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)

    switch (data.type) {
        case ("sendInputs"): {
            if (data.inputs === "Input_1") {
                console.log(`Input_1 received Data: ${data.inputs.wordInput}`)
            }
            if (data.inputs === "Input_2") {
                console.log(`Input_2 received Data: ${data.inputs.wordInput}`)
            }
            break;
        }

        case ("updateIO"): {
            if (data.editIOData["widgetSlider"]) {
                let widgetSliderValue = data.editIOData["widgetSlider"]
                console.log("Widget Moved To: " + widgetSliderValue)
            }
            if (data.editIOData["aToggleSwitch"]) {
                let toggleValue = data.editIOData["aToggleSwitch"]
                console.log("Toggle toggled To: " + toggleValue)

            }
            break;
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