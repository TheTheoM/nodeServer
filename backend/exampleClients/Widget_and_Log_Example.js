const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');
const deviceBSocket = new WebSocket('ws://localhost:8080');

let variableM = 1;


deviceASocket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
    setTimeout(() => {
        deviceASocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceA",
        isNode: true,
        inputNames: [],
        outputNames: ["numberOut"],
        deviceInfo: "A Device using a widget to influence its output.",
        widgets: [
            {
            widgetName: "variableM",
            value: "1",
            widgetType: "slider",
            values: ["1", "100"],
            }
        ]
        }))
    }, 500);

    setTimeout(() => {
        deviceASocket.send(JSON.stringify({
            type:               "requestPersistentLink",
            outputDeviceName:   "DeviceA",
            outputName:         "numberOut",
            inputDeviceName:    "DeviceB",
            inputName:          "numberIn",
        }))
    }, 1000)
})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    switch (data.type) {
        case ("updateIO"): {
            if (data.editIOData["variableM"]) {
                variableM = data.editIOData["variableM"]
            }
            break;
        }
    }
})



deviceBSocket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
    setTimeout(() => {
        deviceBSocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceB",
        isNode: true,
        inputNames: ["numberIn"],
        outputNames: [],
        deviceInfo: "Device B logs all msgs received",
        }))
    }, 500);

})

deviceBSocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    switch (data.type) {
        case ("sendInputs"): {
            if (data.inputs['numberIn']) {
                let number = parseInt(data.inputs['numberIn'])
                
                if (number > 140) {
                    deviceBSocket.send(JSON.stringify({
                        type: "sendLogs",
                        logs: `RCVD Number Too High!: ${number}`,
                        logType: "error",
                    }))

                    //Causes a red ring around the node.
                    
                    deviceBSocket.send(JSON.stringify({   
                        type: "changeStatus",
                        "statusState": "fault",
                    }))
                } else {
                    deviceBSocket.send(JSON.stringify({
                        type: "sendLogs",
                        logs: `RCVD Number: ${number}`,
                        logType: "info",
                    }))

                    // No ring around the node.

                    deviceBSocket.send(JSON.stringify({
                        type: "changeStatus",
                        "statusState": "online",
                    }))
                }
            }
            break;
        }
    }

})

// Send Number to DeviceB, the widget will alter the value of variableM, see DeviceA onMessage.
setInterval(() => {
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "numberOut": variableM * 3 + 5,
        },    
    }))
}, 200);
