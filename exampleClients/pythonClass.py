import websocket, json, time, random
from threading import Thread

class DeviceWS:
    def __init__(self, socket_url: str, verbose: bool, reconnect: bool) -> None:
        self.ws = websocket.WebSocketApp(socket_url,
                                on_open=    self.on_open,
                                on_message= self.on_message,
                                on_close=   self.on_close,
                                on_error=   self.on_error)
        self.isConnected = False
        self.reconnect = reconnect
        self.receiver = None
        self.verbose = verbose
        self.logQueue = []
        self.name       = "exampleClient"
        self.inputNames = ["input_1", "input_2"]
        self.outputNames = ["output_1", "output_2"]
        self.deviceInfo = "Example Client"
        self.widgets    = [
            {
                "widgetName": "testSlider",
                "widgetType": "slider",
                "value": 0,
                "values": ["0", "200"],
            },
        ]
        
    def runWebsocket(self) -> None:
        if (self.reconnect):
            while True:
                self.ws.run_forever()
        else:
            self.ws.run_forever()

    def get_ws(self) -> websocket.WebSocketApp:
        return self.ws

    def on_open(self, ws: websocket.WebSocketApp) -> None:
        self.isConnected = True
        self.send_Queued_Logs()
        print('Connected to WebSocket server') if self.verbose else None
        # Wait for a moment before sending the registration message
        time.sleep(0.5)
        registration_message = {
            "type": "registerDevice",
            "name": self.name,
            "isNode": True,
            "inputNames":  self.inputNames,
            "outputNames": self.outputNames,
            "deviceInfo":  self.deviceInfo,
            "widgets":     self.widgets,

        }
        
        self.ws.send(json.dumps(registration_message))

    def on_message(self, ws: websocket.WebSocketApp, message: str) -> None:
        msg = json.loads(message)
        print('Received message:', msg) if self.verbose else None
        
        if msg["type"] == "sendInputs":
            for key, value in msg["inputs"].items():
                if key == "input_1":
                    print("Input_1 received message")
                    pass
                if key == "input_2":
                    print("Input_2 received message")
                    pass

        if msg["type"] == "updateIO":
            if "testSlider" in msg["editIOData"].keys():
                print(f"Test Slider Moved {int(msg['editIOData']['testSlider'])}")

    def on_close(self, ws, close_status_code, close_msg):
        print('Disconnected from WebSocket server') if self.verbose else None
        self.isConnected = False

    def on_error(self, ws, error):
        print('WebSocket error:', error) if self.verbose else None

    def sendLogs(self, log: str, logType: str):
        print(log) if self.verbose else None
        if (self.isConnected):
            self.ws.send(json.dumps({
                    "type": "sendLogs",
                    "logs": log,
                    "logType": logType
                }))
        else:
            self.logQueue.append([log, logType])
            
    def send_Queued_Logs(self):
        if (self.isConnected):
            for (log, logType) in self.logQueue:
                self.ws.send(json.dumps({
                        "type": "sendLogs",
                        "logs": log,
                        "logType": logType
                }))
                
    def setStatus(self, status: str) -> None:
        if (self.isConnected):
            output_message = {
                "type": "changeStatus",
                "statusState": status,
            }
            self.ws.send(json.dumps(output_message))

    def update_Widgets_Key_Pair(self, widgetName, keyPair):
        if (self.isConnected):
            self.ws.send(json.dumps({
                'type': 'updateWidgetsKeyPair',
                'widgetName': widgetName,
                'keyPair': keyPair,
            }))


def outputFunction(device):
    while True:
        if device.isConnected:
            device.ws.send(json.dumps({
                'type': 'sendOutputs',
                'outputs': {
                    'output_1': random.randint(1, 10),
                    'output_2': random.randint(1, 10),
                }
            }))
            time.sleep(1)


if __name__ == '__main__':
    verbose = True
    device       = DeviceWS('ws://localhost:8080', verbose, True)
    Thread(target = device.runWebsocket).start()
    Thread(target = outputFunction, args=(device,)).start()


