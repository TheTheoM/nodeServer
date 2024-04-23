const WebSocket = require("ws")

const DeviceCSocket = new WebSocket('ws://localhost:8080');
const DeviceDSocket = new WebSocket('ws://localhost:8080');

let variableM = 1;


DeviceCSocket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
    setTimeout(() => {
        DeviceCSocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceC",
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
        DeviceCSocket.send(JSON.stringify({
            type:               "requestPersistentLink",
            outputDeviceName:   "DeviceC",
            outputName:         "numberOut",
            inputDeviceName:    "DeviceD",
            inputName:          "numberIn",
        }))
    }, 1000)
})

DeviceCSocket.addEventListener("message", (msg) => {
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



DeviceDSocket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
    setTimeout(() => {
        DeviceDSocket.send(JSON.stringify({
        type: "registerDevice",
        name: "DeviceD",
        isNode: true,
        inputNames: ["numberIn"],
        outputNames: [],
        deviceInfo: "Device B logs all msgs received",
        }))
    }, 500);

})

DeviceDSocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    switch (data.type) {
        case ("sendInputs"): {
            if (data.inputs['numberIn']) {
                let number = parseInt(data.inputs['numberIn'])
                
                if (number > 140) {
                    DeviceDSocket.send(JSON.stringify({
                        type: "sendLogs",
                        logs: `RCVD Number Too High!: ${number}`,
                        logType: "error",
                    }))

                    //Causes a red ring around the node.
                    
                    DeviceDSocket.send(JSON.stringify({   
                        type: "changeStatus",
                        "statusState": "fault",
                    }))
                } else {
                    DeviceDSocket.send(JSON.stringify({
                        type: "sendLogs",
                        logs: `RCVD Number: ${number}`,
                        logType: "info",
                    }))

                    // No ring around the node.

                    DeviceDSocket.send(JSON.stringify({
                        type: "changeStatus",
                        "statusState": "online",
                    }))
                }
            }
            break;
        }
    }

})

// Send Number to DeviceD, the widget will alter the value of variableM, see DeviceC onMessage.
setInterval(() => {
    DeviceCSocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
            "numberOut": variableM * 3 + 5,
        },    
    }))
}, 200);
