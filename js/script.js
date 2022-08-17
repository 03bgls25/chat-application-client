const config = {
    socket : io('http://localhost:3000'),
    sender: prompt('What is your name?'),
    receiver: null,
    roomUsers: [],
    room: null,
    onlineUsers: document.getElementById('onlineUsers'),
    roomWrapper: document.getElementById('roomWrapper'),
    // msgWrapperClose: document.getElementById('msgWrapperClose'),
    selectedUser: null,
    activeRoom: null,
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
                                    <a href="javascript:void(0)" class="ichat-title-action" id="msgWrapperClose">
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
    },
    setSelectUser: function(){
        config.selectedUser = document.querySelectorAll('.selectUser');
        config.selectedUser.forEach(function(el){
            el.addEventListener('click', (event) => {
                config.receiver = event.target.getAttribute('data-username');
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
                action.openChatWindow({ room: config.room, user: config.receiver });
            })
        })
    },
    closeMsgWrapper: function(){
        config.msgWrapper.classList.remove("ichat-wrapper-show");
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
        action.openChatWindow({ room:data.room, user: data.user });
    }
    action.setOutputMesage(data);
});

