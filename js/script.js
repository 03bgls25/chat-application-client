const config = {
    socket : io('https://isolution-chat-application.herokuapp.com/'),
    sender: prompt('What is your name?'),
    receiver: null,
    roomUsers: [],
    room: null,
    onlineUsers: document.getElementById('onlineUsers'),
    roomWrapper: document.getElementById('roomWrapper'),
    msgWrapperClose: null,
    closedMsgWrapper: null,
    selectedUser: null,
    activeRoom: null,
    openRoom: [],
    frmChat: null
};
const action = {
    setOnlineUsersDom: function(users){
        config.onlineUsers.innerHTML = "";
        users.forEach(user => {
            config.onlineUsers.innerHTML += `<div class="ichat-list-item selectUser" data-username="${user.name}">
                <div class="ichat-user-icon ichat-bg-accent">${user.name.charAt(0).toUpperCase()}</div>
                <div class="ichat-user-details">
                <h2 class="ichat-user-name">${user.name}</h2>
                <p class="ichat-datetime ichat-online">${user.availableFrom}</p>
                </div>
                </div>`;
        });
        action.setSelectUser();
    },
    openChatWindow: function(data){
        config.roomWrapper.innerHTML += `<div class="ichat-wrapper ichat-wrapper-show" id="${ data.room }">
                                <div class="ichat-title ichat-online">
                                    ${data.user}
                                    <a href="javascript:void(0)" class="ichat-title-action msgWrapperClose" data-room="${ data.room }">
                                        <i class="mdi mdi-close"></i>
                                    </a>
                                </div>
                                <div class="ichat-group" id="lstMsg_${ data.room }"></div>
                                <div class="ichat-form">
                                    <form class="frmChat" data-room="${ data.room }">
                                        <textarea class="ichat-input" name="txtChatMsg" placeholder="Type a message here.."></textarea>
                                        <button type="submit" class="ichat-btn"><i class="mdi mdi-send"></i></button>
                                    </form>
                                </div>
                            </div>`;
        action.sendMessage();
        action.closeMsgWrapper();
    },
    setSelectUser: function(){
        config.selectedUser = document.querySelectorAll('.selectUser');
        config.selectedUser.forEach(function(el){
            el.addEventListener('click', () => {
                debugger;
                config.receiver = el.getAttribute('data-username');
                config.roomUsers = [];
                config.roomUsers.push(config.receiver);
                config.roomUsers.push(config.sender);
                config.room = btoa(JSON.stringify(config.roomUsers));
                let data = { 
                    room: config.room, 
                    sender: config.sender, 
                    receiver: config.receiver 
                };
                config.socket.emit('create-room', data);
                if(config.openRoom.includes(config.room)){
                    document.getElementById(config.room).classList.add("ichat-wrapper-show");
                }else{
                    config.openRoom.push(config.room);
                    action.openChatWindow({ room: config.room, user: config.receiver });
                }
            })
        })
    },
    closeMsgWrapper: function(){
        config.msgWrapperClose = document.querySelectorAll('.msgWrapperClose');
        config.msgWrapperClose.forEach(el => {
            el.addEventListener('click', () => {
                config.closedMsgWrapper = el.getAttribute('data-room');
                console.log(config.closedMsgWrapper);
                document.getElementById(config.closedMsgWrapper).classList.remove("ichat-wrapper-show");
            })
        })
            
    },
    sendMessage: function(){
        config.frmChat = document.querySelectorAll('.frmChat');
        config.frmChat.forEach(function(el){
            el.addEventListener('submit',(event) => {
                event.preventDefault();
                config.activeRoom = event.target.getAttribute('data-room');
                let msg = event.target.elements.txtChatMsg.value;
                msg = msg.trim();
                if (!msg) {
                    return false;
                }
                config.socket.emit('chat-message', {
                    room: config.activeRoom, 
                    sender: config.sender,
                    message: msg
                });
                event.target.elements.txtChatMsg.value = '';
                event.target.elements.txtChatMsg.focus();
             })
        });
        
    },
    setOutputMesage: function(data){
        let ownClass = data.user == config.sender ? 'ichat-item-own' : '';
        let msgContainer = 'lstMsg_' + data.room;
        document.getElementById(msgContainer).innerHTML += `<div class="ichat-item ${ownClass}">
                                    <p class="ichat-message">
                                        ${data.message}
                                    </p>
                                    <p class="ichat-datetime">${data.datetime}</p>
                                    </div>`;
        document.getElementById(msgContainer).scrollTop =  document.getElementById(msgContainer).scrollHeight;
    }
}

if(config.sender != null){
    if(config.sender.length != 0){
        config.socket.emit("user-connected", config.sender);
    }else{
        location.reload()
    }
}else{
    location.reload()
}

config.socket.on("user-connected", users => {
    action.setOnlineUsersDom(users.filter(function(obj){
        return obj.name !== config.sender
    }));
})

config.socket.on("user-disconnected", users => {
    action.setOnlineUsersDom(users.filter(function(obj){
        return obj.name !== config.sender
    }));
})

config.socket.on("invite", room => {
    config.socket.emit("join-room", room)
})

//CLOSE MSG DIALOG
// config.msgWrapperClose.addEventListener('click', (event) => {
//     action.closeMsgWrapper();
// });

config.socket.on("message", function (data) {
    var el = document.getElementById(data.room);
    if(el == null){
        if(config.openRoom.includes(data.room)){
            document.getElementById(data.room).classList.add("ichat-wrapper-show");
        }else{
            config.openRoom.push(config.room);
            action.openChatWindow({ room: data.room, user: data.user });
        }
    }
    action.setOutputMesage(data);
});

