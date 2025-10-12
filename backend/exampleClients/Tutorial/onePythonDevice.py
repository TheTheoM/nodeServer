import json, random, time, websocket
from threading import Thread

def on_open(ws):
    # Put your device information here. Name, inputs, outputs etc.
    global isConnected
    isConnected = True
    registration_message = {
        "type": "registerDevice",
        "name": "PythonDevice",
        "isNode": True,
        "inputNames": ["Input_1", "Input_2"],
        "outputNames": ["Output_1", "Output_2"],
        "deviceInfo": "Example Device",
    }
    ws.send(json.dumps(registration_message))

def on_message(ws, message):
    # 
    message = json.loads(message)
    # print(message)
    
    match message["type"]:
        case "connected": 
            print("Device successfully registered to Server.")
            
        case "nameTaken":
            print("Name is taken. Retry with a different name.")
        
        case "sendInputs": # Handle the data sent to your device inputs here.
            for inputName, data in message["inputs"].items():
                if inputName == "Input_1":
                    print(f"Input_1 received message: {data}")

                if inputName == "Input_2":
                    print(f"Input_2 received message: {data}")
        case _:
            print(message)

def output_function():
    """Periodically send outputs to the WebSocket server."""
    global ws, isConnected
    while True:
        if isConnected:
            output_message = {
                'type': 'sendOutputs',
                'outputs': {
                    'Output_1': random.randint(1, 10),
                    'Output_2': random.randint(1, 10),
                }
            }
            ws.send(json.dumps(output_message))
        time.sleep(0.5)

if __name__ == "__main__":
    # WebSocket setup and threads initialization
    isConnected = False
    ws = websocket.WebSocketApp("ws://localhost:8080", on_open=on_open, on_message=on_message)
    Thread(target=ws.run_forever).start()
    Thread(target=output_function).start()
