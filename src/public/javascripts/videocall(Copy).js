
//Get user media polyfill
if (!navigator.mediaDevices) navigator.mediaDevices = {};
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || (function () {
    // returns a getUserMedia function
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    return function (constraints) {
        if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }
        return new Promise(function (resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
        });
    };
})();

(function (speechRecognition) {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || SpeechRecognition;
})(window.SpeechRecognition || window.webkitSpeechRecognition);

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};
const dataChannelOptions = {
    ordered: false, // do not guarantee order
    maxPacketLifeTime: 3000, // in milliseconds
};
var constraints = {
    video: true
};
var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};
var room = 'foo';
var socket;

var closeButton = document.getElementById("close");
    closeButton.addEventListener("click", function () {
        document.getElementById("videocontainer").style.display = "none";
        chatbutton.style.display = "";
    });

function startChat() {
    document.getElementById("videocontainer").style.display = "";
    socket =  io.connect();
    //socket = io.connect('http://localhost:8443',{'forceNew':true });
    socket.on('connect', function(msg){
        socket.emit('join', prompt('your name?'));
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('disconnection', function(msg){
        console.log("somebody disconnected");
        window.scrollTo(0, document.body.scrollHeight);
    });

    $('form').submit(function(){
        let msg = $('#m').val();
        socket.emit('chatmessage', msg);
        $('#m').val('');
        $('#messages').append($('<div class="currentuser">').text(msg));
        return false;
    });
    socket.on('chatmessage', function(msg){
        $('#messages').append($('<div class="anotheruser">').text(msg));
        speak(msg);
        window.scrollTo(0, document.body.scrollHeight);
    });
    var synth = window.speechSynthesis;
    function speak(message) {
        synth.speak(new SpeechSynthesisUtterance(message))
    }


    //Speech Recognition stuff
    function createRecognition(){
        let recognizer = new SpeechRecognition();
        recognizer.lang = 'en-US';
        recognizer.interimResults = false;
        recognizer.continuous = true;
        recognizer.maxAlternatives = 1;

        let counter = 0;
        recognizer.onresult = e => {
            console.log(e.results);
            let result = e.results[counter][0].transcript;
            console.log(result);
            let elem = document.createElement('span');
            elem.innerText = result;
            document.body.appendChild(elem);
            counter++;
            socket.emit('chatmessage', result);
            recognizer.stop();
            createRecognition();
        };
        recognizer.start();

    }

    createRecognition();
}

let displaystate = 0;
let loginForm;
function createLoginForm() {
    var login = document.createElement("div");
    login.setAttribute("id","login");
    var headingContainer = document.createElement("div");
    headingContainer.className = "block-heading";
    var heading = document.createElement("h2");
    heading.className = "text-info";
    var headingText = document.createTextNode("Login");
    heading.appendChild(headingText);
    var i = document.createElement("i");
    i.className = "fa fa-close";
    i.style = "float:right";
    i.addEventListener("click", function () {
        loginForm.style.display = "none";
        displaystate = 2;
    });
    heading.appendChild(i);
    headingContainer.appendChild(heading);
    login.appendChild(headingContainer);

    var form = document.createElement("form");
    form.addEventListener("submit", function () {
        event.preventDefault();
    });
    var emailContainer = document.createElement("div");
    emailContainer.className = "input_container";
    var emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.id = "loginemail";
    emailInput.placeholder = "Type your email here";
    var emailInputIcon = document.createElement("i");
    emailInputIcon.className = "fas fa-envelope";
    emailContainer.appendChild(emailInput);
    emailContainer.appendChild(emailInputIcon);
    form.appendChild(emailContainer);

    var passwordContainer = document.createElement("div");
    passwordContainer.className = "input_container";
    var passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.id = "loginpassword";
    passwordInput.placeholder = "Type your password here";
    var passwordInputIcon = document.createElement("i");
    passwordInputIcon.className = "fa fa-key";
    passwordContainer.appendChild(passwordInput);
    passwordContainer.appendChild(passwordInputIcon);
    form.appendChild(passwordContainer);

    var container = document.createElement("div");
    container.className = "form-group";
    var remembermelabel = document.createElement("label");
    remembermelabel.className = "chcekbox-group";

    var rememberme = document.createElement("span");
    rememberme.className = "checktext";
    var remembermeText = document.createTextNode("Remember me");
    rememberme.appendChild(remembermeText);

    var checkboxInput = document.createElement("input");
    checkboxInput.type = "checkbox";

    var checkmark = document.createElement("span");
    checkmark.className = "checkmark";

    remembermelabel.appendChild(rememberme);
    remembermelabel.appendChild(checkboxInput);
    remembermelabel.appendChild(checkmark);
    container.appendChild(remembermelabel);


    var forgotPass = document.createElement("span");
    forgotPass.addEventListener("click", function () {
        form.removeChild(passwordContainer);
        stateChange(["Send code", "none", "Remembered your password? ",
            "Login","Reset Password", 2]);
    });
    var forgotPassText = document.createTextNode("forgot password?");
    forgotPass.appendChild(forgotPassText);
    container.appendChild(forgotPass);
    form.appendChild(container);

    var loginButton = document.createElement("button");
    var loginButtonText = document.createTextNode("Login");
    loginButton.type = "button";
    loginButton.appendChild(loginButtonText);
    console.log("test");


    /*
    * Login Function
    * */
    function loginQuery() {
        console.log("test");
        event.preventDefault();
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://localhost:16001/login", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                alert(xhr.response);
                let result = JSON.parse(xhr.response);
                if(result.success === true){
                    //document.getElementById("loggedOut").style.display = "none";
                    //document.getElementById("loggedIn").style.display = "block";
                    displaystate = 1;
                    showLoginForm();
                    startChat();
                }
            }
        };
        xhr.send(JSON.stringify({
            username: emailInput.value,
            password: passwordInput.value
        }));
    }
    loginButton.addEventListener("click", loginQuery);
    form.appendChild(loginButton);

    /*
    * Register Function
    * */
    function registerQuery() {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://localhost:16001/register", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                alert(xhr.response);
                let result = JSON.parse(xhr.response);
                if(result.success === true){
                    console.log("register success");
                    //document.getElementById("loggedOut").style.display = "none";
                    //document.getElementById("loggedIn").style.display = "block";
                }
            }
        };
        let message = JSON.stringify({
            password: passwordInput.value,
            email: emailInput.value,
            username: nameInput.value
        });
        xhr.send(message);
    }

    var formp = document.createElement("p");
    formp.id = "guestLogin";
    formp.textContent = "or";
    var continueAsGuest = document.createElement("span");
    continueAsGuest.textContent = "Continue as guest";
    formp.appendChild(continueAsGuest);
    form.appendChild(formp);
    login.appendChild(form);

    var hr = document.createElement("hr");
    login.appendChild(hr);

    var loginp = document.createElement("p");
    var loginpText = document.createTextNode("Don't have an account? ");
    loginp.appendChild(loginpText);
    var registerNow = document.createElement("span");
    registerNow.textContent = "Register now";
    registerNow.id = "registerbutton";

    let nameContainer;
    nameContainer = document.createElement("div");
    nameContainer.className = "input_container";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "registername";
    nameInput.placeholder = "Type your name here";
    var nameInputIcon = document.createElement("i");
    nameInputIcon.className = "fas fa-user";
    nameContainer.appendChild(nameInput);
    nameContainer.appendChild(nameInputIcon);

    let state = 0;
    function stateChange(newState) {
        loginButton.textContent = newState[0];
        forgotPass.style.display = newState[1];
        loginpText.textContent = newState[2];
        registerNow.textContent = newState[3];
        headingText.textContent = newState[4];
        state = newState[5];
    }
    registerNow.addEventListener("click", function () {
        switch(state){
            case 0:
                form.insertBefore(nameContainer, emailContainer);
                loginButton.removeEventListener("click", loginQuery);
                loginButton.addEventListener("click", registerQuery);
                stateChange(["Sign Up", "none", "Already have an account? ",
                    "Login","Register", 1]);
                break;
            case 1:
                form.removeChild(nameContainer);
                loginButton.removeEventListener("click", registerQuery);
                loginButton.addEventListener("click", loginQuery);
                stateChange(["Login", "unset", "Don't have an account? ",
                    "Register","Login", 0]);
                state = 0;
                break;
            case 2:
                form.insertBefore(passwordContainer, container);
                stateChange(["Login", "unset", "Don't have an account? ",
                    "Register","Login", 0]);
                state = 0;
        }

    });
    loginp.appendChild(registerNow);
    login.appendChild(loginp);
    document.getElementById("megacontainer").appendChild(login);
    return login;
}

function showLoginForm() {
    switch (displaystate) {
        case 0:
            loginForm = createLoginForm();
            displaystate = 1;
            break;
        case 1:
            loginForm.style.display = "none";
            displaystate = 2;
            break;
        case 2:
            loginForm.style.display = "unset";
            displaystate = 1;
            break;
    }
}


var chatbutton = document.getElementById("chatbutton");
    chatbutton.addEventListener("click", showLoginForm);

///////////////////////////// video creation
var localVideo = document.createElement("video");
    localVideo.muted = true;
    localVideo.autoplay = true;
var localVideoContainer = document.createElement("div");
    localVideoContainer.appendChild(localVideo);
var remoteVideo = document.createElement("video");
    remoteVideo.autoplay = true;
var remoteVideoContainer = document.createElement("div");
    remoteVideoContainer.appendChild(remoteVideo);
var remoteVideoButtonContainer = document.createElement("div");

var fullscreenButton = document.createElement("button");
    fullscreenButton.addEventListener("click",function () {
        if (remoteVideoContainer.requestFullscreen) {
            remoteVideoContainer.requestFullscreen();
        } else if (remoteVideoContainer.mozRequestFullScreen) { /* Firefox */
            remoteVideoContainer.mozRequestFullScreen();
        } else if (remoteVideoContainer.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            remoteVideoContainer.webkitRequestFullscreen();
        } else if (remoteVideoContainer.msRequestFullscreen) { /* IE/Edge */
            remoteVideoContainer.msRequestFullscreen();
        }
    });
var fullscreenIcon = document.createElement("i");
    fullscreenIcon.className = "fas fa-expand";
fullscreenButton.appendChild(fullscreenIcon);
remoteVideoButtonContainer.appendChild(fullscreenButton);
remoteVideoContainer.appendChild(remoteVideoButtonContainer);

var volumeButton = document.createElement("button");
volumeButton.addEventListener("click",function () {
    if(volumeSlider.style.display === ""){
        volumeSlider.style.display = "none";
    } else {
        volumeSlider.style.display = "";
    }

});
var volumeIcon = document.createElement("i");
volumeIcon.className = "fas fa-volume-up";
volumeButton.appendChild(volumeIcon);
remoteVideoButtonContainer.appendChild(volumeButton);
remoteVideoContainer.appendChild(remoteVideoButtonContainer);

var volumeSlider = document.createElement("input");
    volumeSlider.setAttribute("type","range");
    volumeSlider.setAttribute("min","1");
    volumeSlider.setAttribute("max","100");
    volumeSlider.className = "slider";
    volumeSlider.style.display = "none";

remoteVideoButtonContainer.appendChild(volumeSlider);

var videocontainer = document.getElementById("videos");
videocontainer.appendChild(localVideoContainer);
videocontainer.appendChild(remoteVideoContainer);

var backButton = document.getElementById("back");
backButton.addEventListener("click", function () {
    videocontainer.className = "videosInvisible";
});

$('#disconnect').click(function(){
    socket.disconnect();
});
$('#videocall').click(function(){
    videocontainer.className = "videosVisible";
    // socket.socket.reconnect();
    //socket = io.connect('http://localhost:3000',{'force new connection':true });


    if (room !== '') {
        socket.emit('create or join', room);
        console.log('Attempted to create or  join room', room);
    }

    socket.on('created', function(room) {
        console.log('Created room ' + room);
        isInitiator = true;
    });

    socket.on('full', function(room) {
        console.log('Room ' + room + ' is full');
    });

    socket.on('join', function (room){
        console.log('Another peer made a request to join room ' + room);
        console.log('This peer is the initiator of room ' + room + '!');
        isChannelReady = true;
    });

    socket.on('joined', function(room) {
        console.log('joined: ' + room);
        isChannelReady = true;
    });

    socket.on('log', function(array) {
        console.log.apply(console, array);
    });


    function sendMessage(message) {
        console.log('Client sending message: ', message);
        socket.emit('message', message);
    }

    // This client receives a message
    socket.on('message', function(message) {
        console.log('Client received message:', message);
        if (message === 'got user media') {
            maybeStart();
        } else if (message.type === 'offer') {
            if (!isInitiator && !isStarted) {
                maybeStart();
            }
            pc.setRemoteDescription(new RTCSessionDescription(message));
            doAnswer();
        } else if (message.type === 'answer' && isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        } else if (message === 'bye' && isStarted) {
            handleRemoteHangup();
        }
    });

    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
    }).then(gotStream).catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
    });

    function gotStream(stream) {
        console.log('Adding local stream.');
        localStream = stream;
        localVideo.srcObject = stream;
        sendMessage('got user media');
        if (isInitiator) {
            maybeStart();
        }
    }


    console.log('Getting user media with constraints', constraints);
    if (location.hostname !== 'localhost') {
        requestTurn(
            'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
        );
    }

    function maybeStart() {
        console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
        if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
            console.log('>>>>>> creating peer connection');
            createPeerConnection();
            pc.addStream(localStream);
            isStarted = true;
            console.log('isInitiator', isInitiator);
            if (isInitiator) {
                doCall();
            }
        }
    }

    window.onbeforeunload = function() {
        sendMessage('bye');
    };

    /////////////////////////////////////////////////////////


    function createPeerConnection() {
        try {
            pc = new RTCPeerConnection(null);
            pc.onicecandidate = handleIceCandidate;
            pc.onaddstream = handleRemoteStreamAdded;
            pc.onremovestream = handleRemoteStreamRemoved;
            console.log('Created RTCPeerConnnection');
            // Establish your peer connection using your signaling channel here
            const dataChannel =
                pc.createDataChannel("myLabel", dataChannelOptions);

            dataChannel.onerror = (error) => {
                console.log("Data Channel Error:", error);
            };

            dataChannel.onmessage = (event) => {
                console.log("Got Data Channel Message:", event.data);
            };

            dataChannel.onopen = () => {
                dataChannel.send("Hello World!");
            };

            dataChannel.onclose = () => {
                console.log("The Data Channel is Closed");
            };


        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
    }

    function handleIceCandidate(event) {
        console.log('icecandidate event: ', event);
        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    }

    function handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    }

    function doCall() {
        console.log('Sending offer to peer');
        pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    function doAnswer() {
        console.log('Sending answer to peer.');
        pc.createAnswer().then(
            setLocalAndSendMessage,
            onCreateSessionDescriptionError
        );
    }

    function setLocalAndSendMessage(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        sendMessage(sessionDescription);
    }

    function onCreateSessionDescriptionError(error) {
        trace('Failed to create session description: ' + error.toString());
    }

    function requestTurn(turnURL) {
        var turnExists = false;
        for (var i in pcConfig.iceServers) {
            if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
                turnExists = true;
                turnReady = true;
                break;
            }
        }
        if (!turnExists) {
            console.log('Getting TURN server from ', turnURL);
            // No TURN server. Get one from computeengineondemand.appspot.com:
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var turnServer = JSON.parse(xhr.responseText);
                    console.log('Got TURN server: ', turnServer);
                    pcConfig.iceServers.push({
                        'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
                        'credential': turnServer.password
                    });
                    turnReady = true;
                }
            };
            xhr.open('GET', turnURL, true);
            xhr.send();
        }
    }

    function handleRemoteStreamAdded(event) {
        console.log('Remote stream added.');
        remoteStream = event.stream;
        remoteVideo.srcObject = remoteStream;
    }

    function handleRemoteStreamRemoved(event) {
        console.log('Remote stream removed. Event: ', event);
    }

    function hangup() {
        console.log('Hanging up.');
        stop();
        sendMessage('bye');
    }

    function handleRemoteHangup() {
        console.log('Session terminated.');
        stop();
        isInitiator = false;
    }

    function stop() {
        isStarted = false;
        pc.close();
        pc = null;
        document.getElementById("videocontainer").parentElement.removeChild(document.getElementById("videocontainer"));
    }





});
