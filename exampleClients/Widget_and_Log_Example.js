const WebSocket = require("ws")

const deviceASocket = new WebSocket('ws://localhost:8080');
const deviceBSocket = new WebSocket('ws://localhost:8080');

let moderatorPosition = 0;
let uranium           = 0;
let uraniumAmount     = 0;

// DeviceA outputs an integer 


deviceASocket.addEventListener('open', () => {
    console.log('Connected to WebdeviceASocket server');
    setTimeout(() => {
        deviceASocket.send(JSON.stringify({
        type: "registerDevice",
        name: "Uranium Supply",
        isNode: true,
        inputNames: [],
        outputNames: ["uranium"],
        deviceInfo: "A very real uranium supplier.",
        widgets: [
            {
            widgetName: "uraniumAmount",
            value: "1",
            widgetType: "slider",
            values: ["1", "100"],
            }
        ]
        }))
    }, 500);

    setTimeout(() => {
        deviceASocket.send(JSON.stringify({
            type: "requestPersistentLink",
            outputDeviceName: "Uranium Supply",
            outputName: "uraniumAmount",
            inputDeviceName: "Fission Reactor",
            inputName: "uranium",

        }))

    }, 1000)


})

deviceASocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)
    switch (data.type) {
        case ("updateIO"): {
            if (data.editIOData["uraniumAmount"]) {
                uraniumAmount = data.editIOData["uraniumAmount"]
            }
            break;
        }
    }
})

setInterval(() => {
    deviceASocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
        "uranium": uraniumAmount,
        },    
    }))

  
}, 200);

deviceBSocket.addEventListener('open', () => {
    console.log('Connected to WebdeviceBSocket server');
    setTimeout(() => {
        deviceBSocket.send(JSON.stringify({
        type: "registerDevice",
        name: "Fission Reactor",
        isNode: true,
        inputNames: ["uranium"],
        outputNames: ["Energy"],
        deviceInfo: "A very real reactor.",
        widgets: [
            {
            widgetName: "moderator",
            value: "1",
            widgetType: "slider",
            values: ["1", "100"],
            }
        ]
        }))
    }, 500);

})

deviceBSocket.addEventListener("message", (msg) => {
    let data = JSON.parse(msg.data)

    switch (data.type) {
        case ("updateIO"): {
            if (data.editIOData["moderator"]) {
                moderatorPosition = data.editIOData["moderator"]
            }
            break;
        }
        case ("sendInputs"): {
            if (data.inputs['uranium']) {
                uranium = data.inputs['uranium']
            }

            break;
        }
    }

})

setInterval(() => {
    function fissionSimulator(uranium, moderatorPosition) {
        let energy = uranium * ((3 * 10**8) ** 2)
        let moderatedEnergy = energy / moderatorPosition
        return moderatedEnergy;
    }

    let energy = fissionSimulator(uranium, moderatorPosition)
    console.log(energy)
    deviceBSocket.send(JSON.stringify({
        type: "sendOutputs",
        outputs: {
        "Energy": energy,
        },    
    }))

    deviceBSocket.send(JSON.stringify({
        type: "sendLogs",
        logType: "info",
        logs: `Energy Produced ${energy}W`,    
    }))

}, 200);


