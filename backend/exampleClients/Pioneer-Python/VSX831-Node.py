import websocket, json, time, eiscp, argparse, sys
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
        self.name       = "rcvr"
        self.inputNames = {"setVolume": "int", "Vol+": "boolean", "Vol-": "boolean", "mute": "boolean", "power": "boolean"}
        self.outputNames = {"Volume": "int", "muteStatus": "boolean"}
        self.deviceInfo = "RCVR Client"
        self.widgets    = [
                    {
                        "widgetName": "Volume",
                        "widgetType": "slider",
                        "value": 0,
                        "values": ["0", "200"],
                    },
                    {
                        "widgetName": "muteState",
                        "widgetType": "displayIcon",
                        "value": 'Mute',
                        'style': {
                            'color': 'gray',
                        }
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
                if key == "setVolume":
                    receiver.setVolume()

                if key == "Vol+" and (value == True or value == '1'):
                    receiver.increaseVolume()

                if key == "Vol-" and (value == True or value == '1'):
                    receiver.decreaseVolume()

                if key == "mute" and (value == True or value == '1'):
                    receiver.toggleMute()
                    
                if key == "power" and (value == True or value == '1'):
                    receiver.togglePower()
                        
        if msg["type"] == "updateIO":
            if "Volume" in msg["editIOData"].keys():
                receiver.setVolume(int(msg["editIOData"]["Volume"]))

            if "muteState" in msg["editIOData"].keys():
                receiver.toggleMute()

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


    def sendMuteStatus(self, muteStatus: str) -> None:
        if self.isConnected:
            output_message = {
                "type": "sendOutputs",
                "outputs": {
                    "muteStatus": muteStatus
                }
            }
            self.ws.send(json.dumps(output_message))


    def sendVolume(self, volume: str) -> None:
        if self.isConnected:
            output_message = {
                "type": "sendOutputs",
                "outputs": {
                    "Volume": volume
                }
            }
            self.ws.send(json.dumps(output_message))


    def update_Widgets_Key_Pair(self, widgetName, keyPair):
        if (self.isConnected):
            self.ws.send(json.dumps({
                'type': 'updateWidgetsKeyPair',
                'widgetName': widgetName,
                'keyPair': keyPair,
            }))

class RCVR:
    def __init__(self, receiver_IP: str, status_Interval: int, device: DeviceWS, verbose: bool) -> None:
        """This Class handles communication with the receiver (Mute-Vol pinging, Setting mute & Vol)

        Args:
            receiver_IP (str):     Receiver IP "192.168.0.0"
            status_Interval (int): (Seconds) The interval between repetitive vol+mute pinging.
            device (webSocket):    The class used to communicate with the nodeServer. E.g. Updating Widgets, sending outputs.
        """
        self.status_Interval  = status_Interval 
        self.receiver_IP = receiver_IP
        self.last_Time = time.time()
        self.volume_Increment  = 6
        self.lastCommandTime = 0
        self.verbose = verbose
        self.muteToggle = None
        self.powerToggle = None
        self.command_Queue = []
        self.vol_Abs = 0
        self.device = device
        self.last_rcvr_msg = time.time()
        self.rcvr_timeout  = 10

    def receiverThread(self) -> None:
        while True:
            self.device.sendLogs(f"Attempting to Reconnect to RCVR.", "error")
            try:
                with eiscp.eISCP(self.receiver_IP) as receiver:
                    self.device.setStatus('online')
                    self.device.sendLogs(f"Connected to RCVR", "info")
                    
                    while True:
                        if time.time() - self.last_Time > self.status_Interval:
                            self.command_Queue.append('volume=query') 
                            self.command_Queue.append('audio-muting=query') 
                            self.last_Time = time.time()
                        
                        for cmd in self.command_Queue:
                            if cmd == 'volume=query':     
                                self.vol_Abs = receiver.command(cmd)[1]
                                vol_Neg = - 82.0 - self.vol_Abs / 2.0
                                self.update_Volume_Widget(self.vol_Abs)
                                self.last_rcvr_msg = time.time()
                                
                            elif cmd == 'audio-muting=query':     
                                mute_Status_Str = receiver.command(cmd)[1]
                                new_mute_toggle = True if mute_Status_Str == "on" else False
                                
                                if new_mute_toggle != self.muteToggle:
                                    self.muteToggle = new_mute_toggle
                                    self.update_Mute_Widget(self.muteToggle)
                                    self.last_rcvr_msg = time.time()

                            elif cmd == 'increaseVolume':
                                self.vol_Abs = receiver.command('volume=query')[1]
                                new_Vol_Abs = self.vol_Abs + self.volume_Increment
                                self.update_Volume_Widget(new_Vol_Abs)
                                self.device.sendVolume(new_Vol_Abs)
                                self.vol_Abs = receiver.command(f'volume={new_Vol_Abs}')[1]
                                vol_Neg = - 82.0 - self.vol_Abs / 2.0
                                self.device.sendLogs(f"Volume Changed to {self.vol_Abs} / {vol_Neg}", "info")

                            elif cmd == 'decreaseVolume':
                                self.vol_Abs = receiver.command('volume=query')[1]
                                new_Vol_Abs = self.vol_Abs - self.volume_Increment
                                self.update_Volume_Widget(new_Vol_Abs)
                                self.device.sendVolume(new_Vol_Abs)
                                self.vol_Abs = receiver.command(f'volume={new_Vol_Abs}')[1]
                                vol_Neg = - 82.0 - self.vol_Abs / 2.0
                                self.device.sendLogs(f"Volume Changed to {self.vol_Abs} / {vol_Neg}", "info")

                            elif 'volume=' in cmd: 
                                receiver.command(cmd)
                                self.vol_Abs = receiver.command('volume=query')[1]
                                self.device.sendVolume(self.vol_Abs)
                                vol_Neg = - 82.0 - self.vol_Abs / 2.0
                                self.update_Volume_Widget(self.vol_Abs)
                                self.device.sendLogs(f"Volume Changed to {self.vol_Abs} / {vol_Neg}", "info")

                            elif 'audio-muting=' in cmd: 
                                receiver.command(cmd)
                                self.device.sendLogs(f"Receiver {'muted' if 'on' in cmd else 'un-Muted'}", "info")
                                
                            elif 'power=' in cmd:
                                receiver.command(cmd)
                                self.device.sendLogs(f"Receiver {'muted' if 'on' in cmd else 'un-Muted'}", "info")

                                
                            else:
                                print(f"Unknown Command: {cmd}")

                            self.command_Queue.remove(cmd)
                        
                        if time.time() - self.last_rcvr_msg > self.rcvr_timeout:
                            self.device.sendLogs(f"Disconnecting from receiver.", "error")
                            self.device.setStatus('error')
                            time.sleep(5)
                            break
                        time.sleep(0.1)
                        

            except AssertionError as err:
                self.device.sendLogs(f"AssertionError at receiverThread(). Command {cmd} Error: {err}  .", "error")
                self.device.setStatus("criticalFault")
                time.sleep(2)
                
            except ValueError as err:
                self.device.sendLogs(f"ValueError Timeout at receiverThread(). Command {cmd} Error: {err} .", "error")
                self.device.setStatus("criticalFault")
                time.sleep(2)
            
            except Exception as err:
                self.device.sendLogs(f"Error at receiverThread(). Command {cmd} Error: {err} .", "error")
                self.device.setStatus("criticalFault")
                time.sleep(2)
        
            self.device.sendLogs(f"Disconnecting from RCVR.", "error")

                    
    def increaseVolume(self) -> None:
        self.command_Queue.append("increaseVolume")
        self.device.setStatus('online')
                        
    def decreaseVolume(self) -> None:
        self.command_Queue.append("decreaseVolume")
        self.device.setStatus('online')
                        
    def setVolume(self, newVolABS) -> None:
        if (newVolABS >= 170):
            self.device.sendLogs(f"Volume to Loud {newVolABS}", "error")
            self.update_Volume_Widget(0)
            self.device.setStatus('alert')
            return
        else:
            self.device.setStatus('online')

        if (time.time() > 0.2 + self.lastCommandTime): 
            self.command_Queue.append(f"volume={newVolABS}")
            self.lastCommandTime = time.time()
        else:
            newVolABS += self.volume_Increment
            self.vol_Abs = newVolABS
            self.command_Queue.append(f"volume={self.vol_Abs}")
            self.device.sendLogs("'setVolume' called too often.", "warning")
        
    def toggleMute(self) -> None:
        self.muteToggle = not self.muteToggle
        state = "on" if self.muteToggle else "off"
        self.update_Mute_Widget(self.muteToggle)
        self.command_Queue.append(f'audio-muting={state}')
            
    def togglePower(self) -> None:
        self.powerToggle = not self.powerToggle
        state = "on" if self.powerToggle else "off"
        self.command_Queue.append(f'power={state}')
            
    def update_Volume_Widget(self, vol_Abs) -> None:
        if self.device == None:
            print("Device Null") if self.verbose else None
            return 
        self.device.update_Widgets_Key_Pair('Volume', {'value': str(vol_Abs)})
        
    def update_Mute_Widget(self, mute_Status) -> None:
        if self.device == None:
            print("Device Null") if self.verbose else None
            return 
        

        
        if mute_Status:
            self.device.update_Widgets_Key_Pair("muteState", {'style': {
                                                'color': 'red',
                                                'filter': 'drop-Shadow(0px 0px 5px red)',
                                            }})
            self.device.sendMuteStatus(True)
            
        else:
            self.device.update_Widgets_Key_Pair("muteState", {'style': {
                                        'color': 'gray',
                                        'filter': 'none',
                                    }})
            self.device.sendMuteStatus(False)
            

    def get_Receiver(self):
        return self


if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Start device and receiver threads.')
    parser.add_argument('--localhost', type=str, default='ws://localhost:8080', help='WebSocket address for DeviceWS')
    parser.add_argument('--ip', type=str, default='192.168.1.77', help='IP address for RCVR')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()

    verbose = args.verbose

    device = DeviceWS(args.localhost, verbose, True)
    receiver = RCVR(args.ip, 1, device, verbose)

    Thread(target=device.runWebsocket).start()
    Thread(target=receiver.receiverThread).start()
