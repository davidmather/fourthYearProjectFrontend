if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", {scope: "/"})
.then(function (registration) {
        console.log("Service Worker Registered");
    });

    navigator.serviceWorker.ready.then(function (registration) {
        console.log("Service Worker Ready");
    });

}



var myusername;
let deferredPrompt;
let webpage = document.getElementById("webpage");
let loaded = false;

window.addEventListener('beforeinstallprompt', (e) => {
    if(!loaded){
        loaded = true;
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        var installAsPWA = document.createElement("button");
        installAsPWA.id="installAsPwa";
        var installAsPWAText = document.createTextNode("Install as pwa");
        installAsPWA.appendChild(installAsPWAText);
        installAsPWA.addEventListener('click', (e) => {
            // Hide the app provided install promotion
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                    webpage.removeChild(installAsPWA)
                }
            })
        });
        webpage.appendChild(installAsPWA);
    }

});




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


var megacontainer = document.getElementById("megacontainer"); /// A fixed positioned container for all the html elements.


function saveToDisk(fileUrl, fileName) {
    var save = document.createElement('a');
    megacontainer.appendChild(save);
    save.href = fileUrl;
    save.download = fileName;
    save.click();
    window.URL.revokeObjectURL(save);
}

var answer = true;
function startChat(username) {
    console.log(username);

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
    var callOngoing = true;
    var videocontainer = document.createElement("div");

    socket =  io.connect();
    //socket = io.connect('http://localhost:8443',{'forceNew':true });
    socket.on('connect', function(msg){
        socket.emit('join', username);
        window.scrollTo(0, megacontainer.scrollHeight);
    });

    socket.on('disconnection', function(msg){
        console.log("somebody disconnected");
        window.scrollTo(0, megacontainer.scrollHeight);
    });


    function printmsg(msg) {
        var receivedMessage = document.createElement("div");
        receivedMessage.className="anotheruser";
        var receivedMessageText = document.createTextNode(msg);
        receivedMessage.appendChild(receivedMessageText);
        messages.appendChild(receivedMessage);
        console.log(msg);
    }


    socket.on('chatmessage', function(msg){
        if(msg.type == "weather"){
            msg  = "The temperature in cork is " + msg.value + " degrees celsius";
            speak(msg);
            printmsg(msg);
        } else if (msg.indexOf("startCall:"+myusername)!==-1){
            console.log("Somebody is trying to start a call with me.");

            var r = confirm(msg.split(",")[1] + "is trying to call you. Click ok to answer");
            if (r == true) {
                txt = "You pressed OK!";
                startVideocall();
            } else {
                txt = "You pressed Cancel!";
            }
        }
        else {
            speak(msg);
            printmsg(msg);
        }

        window.scrollTo(0, megacontainer.scrollHeight);
    });

    function startVideocall(){
        if(!callOngoing){
            videocontainer.className = "videos";
        }
        if(typeof videocontainer !== 'undefined') {
            while (videocontainer.lastElementChild) {
                videocontainer.removeChild(videocontainer.lastElementChild);
            }
        }

        callOngoing = true;
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
        fullscreenIcon.alt = "fullscreen";
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
        volumeIcon.alt = "volume";
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

        var videocontainer = document.createElement("div");
        videocontainer.className = "videos";
        var videosButtonContainer = document.createElement("div");
        videosButtonContainer.id="videosbuttoncontainer";
        var backButton = document.createElement("button");
            backButton.id = "back";
        var backArrow = document.createElement("i");
            backArrow.className = 'far fa-arrow-alt-circle-left';
        backButton.appendChild(backArrow);
        backButton.addEventListener("click", function () {
            videocontainer.className = "videos videosInvisible";
            answer = true;
            if(!callOngoing){
                megacontainer.removeChild(videocontainer);
                callOngoing = true;
            }
        });
        videosButtonContainer.appendChild(backButton);

        var screenshareButton = document.createElement("button");
        var screenshareIcon = document.createElement("i");
        screenshareIcon.className = 'fa fa-desktop';
        screenshareIcon.alt = 'screenshare';
        screenshareButton.appendChild(screenshareIcon);

        screenshareButton.addEventListener("click", function () {
            var displayMediaOptions = {
                video: {
                    cursor: "always"
                },
                audio: true
            };
            navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function(stream){
                let videoTrack = stream.getVideoTracks()[0];
                var sender = pc.getSenders().find(function(s) {
                    return s.track.kind == videoTrack.kind;
                });
                console.log('found sender:', sender);
                sender.replaceTrack(videoTrack);
                localVideo.srcObject = stream;
            }).catch(function(e) {
                alert('getDisplayMedia() error: ' + e.name);
            });
        });
        videosButtonContainer.appendChild(screenshareButton);


        recordingButton = document.createElement("button");
        var recordingIcon = document.createElement("i");
        recordingIcon.className = 'fas fa-dot-circle';
        recordingButton.appendChild(recordingIcon);

        videosButtonContainer.appendChild(recordingButton);


        fileTransferButton = document.createElement("input");
        fileTransferButton.type = "file";
        var chunkLength = 1000;

        var arrayToStoreChunks = [];
        videosButtonContainer.appendChild(fileTransferButton);



        videocontainer.appendChild(videosButtonContainer);
        videocontainer.appendChild(localVideoContainer);
        videocontainer.appendChild(remoteVideoContainer);
        megacontainer.appendChild(videocontainer);



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
            video: {mediaSource: 'screen'}
        }).then(gotStream).catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });

        function gotStream(stream) {
            console.log('Adding local stream.');
            let recordingStream = stream;

            var recordedChunks = [];
            var options = {mimeType: 'video/webm;codecs=vp9'};
            var recording = false;
            recorder = new MediaRecorder(recordingStream, options);
            recorder.ondataavailable = handleDataAvailable;

            function handleDataAvailable(event) {
                recordedChunks.push(event.data);
            }
            recordingButton.addEventListener("click",function () {
                if(!recording){
                    recording = true;
                    recorder.start(500);
                } else {
                    recorder.stop();
                    var blob = new Blob(recordedChunks, {
                        type: 'video/webm'
                    });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    megacontainer.appendChild(a);
                    a.style = 'display: none';
                    a.href = url;
                    a.download = 'recording.webm';
                    a.click();
                    window.URL.revokeObjectURL(url);
                    recording = false
                }

            });
            localStream = stream;
            localVideo.srcObject = stream;
            sendMessage('got user media');
            if (isInitiator) {
                maybeStart();
            }
        }

        if(!answer){
            socket.emit('chatmessage', "startCall:"+username+","+myusername);
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
                var dataChannel;
                pc = new RTCPeerConnection(null);
                pc.ondatachannel = function(event) {
                    // ondatachannel handles what happens when a user receives a call
                    // We overwrite the existing data channel so all event handlers need to be set again.
                    // This is probably better put into two separate functions for caller and receiver.
                    dataChannel = event.channel;
﻿                    dataChannel.onerror = (error) => {
                        console.log("Data Channel Error:", error);
                    };
                    dataChannel.onmessage = handleDatachannelMessage;
                    dataChannel.onopen = handleDatachannelOpen;
                    dataChannel.onclose = handleDatachannelClose;
                };
                pc.onicecandidate = handleIceCandidate;
                pc.onaddstream = handleRemoteStreamAdded;
                pc.onremovestream = handleRemoteStreamRemoved;
                console.log('Created RTCPeerConnnection');

                // Establish your peer connection using your signaling channel here. (Caller)
                dataChannel =
                    pc.createDataChannel("myLabel", dataChannelOptions);

                dataChannel.onerror = (error) => {
                    console.log("Data Channel Error:", error);
                };

                // dataChannel.onmessage = (event) => {
                //     console.log("Got Data Channel Message:", event.data);
                // };
                fileTransferButton.addEventListener("change",function () {
                    var file = fileTransferButton.files[0];
                    // var reader = new window.FileReader();
                    //                     // reader.readAsDataURL(file);
                    //                     // reader.onload = onReadAsDataURL;
                    fileChunks = [];
                    file.arrayBuffer()
                        .then(buffer => {
                            const chunkSize = 16 * 1024;
                            while(buffer.byteLength) {
                                const chunk = buffer.slice(0, chunkSize);
                                buffer = buffer.slice(chunkSize, buffer.byteLength);
                                dataChannel.send(chunk);
                            }

                            // End message to signal that all chunks have been sent
                            dataChannel.send('Done!'+file.name);
                        });
                });
                // function onReadAsDataURL(event, text) {
                //     var data = {}; // data object to transmit over data channel
                //
                //     if (event) text = event.target.result; // on first invocation
                //
                //     if (text.length > chunkLength) {
                //         data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
                //     } else {
                //         data.message = text;
                //         data.last = true;
                //     }
                //     console.log("testing");
                //     dataChannel.send(JSON.stringify(data)); // use JSON.stringify for chrome!
                //
                //     var remainingDataURL = text.slice(data.message.length);
                //     if (remainingDataURL.length) setTimeout(function () {
                //         onReadAsDataURL(null, remainingDataURL); // continue transmitting
                //     }, 500)
                // }

                var fileChunks = [];
                function handleDatachannelMessage(event){
                    console.log(event.data);
                    let stringrep = event.data.toString();
                    if (stringrep.indexOf('Done!')  != -1) {
                        // Once, all the chunks are received, combine them to form a Blob
                        const file = new Blob(fileChunks);

                        console.log('Received', file);

                        // Download the received file using downloadjs
                        download(file, stringrep.split("Done!")[1]);
                    }
                    else {
                        // Keep appending various file chunks
                        fileChunks.push(event.data);
                    }

                    // var data = JSON.parse(event.data);
                    //
                    // arrayToStoreChunks.push(data.message); // pushing chunks in array
                    //
                    // if (data.last) {
                    //     saveToDisk(arrayToStoreChunks.join(''), 'fake.php');
                    //     arrayToStoreChunks = []; // resetting array
                    // }
                }

                function handleDatachannelOpen(){
                    console.log("The data channel is open")
                }
                function handleDatachannelClose(){
                    console.log("The Data Channel is Closed");
                }

                dataChannel.onmessage = handleDatachannelMessage;
                dataChannel.onopen = handleDatachannelOpen;
                dataChannel.onclose = handleDatachannelClose;


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
            callOngoing = false;
            sendMessage('bye');
        }

        function handleRemoteHangup() {
            console.log('Session terminated.');
            stop();
            callOngoing = false;
            isInitiator = false;
        }

        function stop() {
            isStarted = false;
            pc.close();
            pc = null;
            callOngoing = false;
            megacontainer.removeChild(videocontainer);
        }
    }

    var chatContainer = document.createElement("div");
    chatContainer.className="chatcontainer";
    var buttonContainer = document.createElement("div");
    buttonContainer.className="buttoncontainer";
    var videocallbutton = document.createElement("button");
    videocallbutton.title = "start a videocall";
    videocallbutton.id = "videocallbutton";
    var videocallIcon = document.createElement("i");
    videocallIcon.className = "fa fa-video-camera";
    videocallbutton.addEventListener("click",function (){
        answer = false;
        startVideocall()
    });
    videocallbutton.appendChild(videocallIcon);
    buttonContainer.appendChild(videocallbutton);

    var phonecallbutton = document.createElement("button");
    phonecallbutton.title = "start a videocall";
    var phoneIcon = document.createElement("i");
    phoneIcon.className = "fa fa-phone";
    phonecallbutton.appendChild(phoneIcon);
    buttonContainer.appendChild(phonecallbutton);

    var closebutton = document.createElement("button");
    closebutton.title = "Close chat";
    closebutton.addEventListener("click", function () {
        megacontainer.removeChild(chatContainer);
    });
    var closeIcon = document.createElement("i");
    closeIcon.className = "fa fa-close";
    closebutton.appendChild(closeIcon);
    buttonContainer.appendChild(closebutton);
    chatContainer.appendChild(buttonContainer);

    var messages = document.createElement("div");
    messages.textContent = "test";
    messages.className="messages";
    chatContainer.appendChild(messages);

    var form = document.createElement("form");
    var newmessage = document.createElement("div");
    newmessage.className = "newmessage";
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message";
    newmessage.appendChild(input);
    form.appendChild(newmessage);

    var chatMessageButtonContainer = document.createElement("div");
    chatMessageButtonContainer.className="chatMessageButtonContainer";
    var uploadImageButton = document.createElement("button");
    uploadImageButton.className = "uploadimage";
    uploadImageButton.title = "upload image";
    var uploadImageIcon = document.createElement("i");
    uploadImageIcon.className = "fa fa-image";
    uploadImageButton.appendChild(uploadImageIcon);
    chatMessageButtonContainer.appendChild(uploadImageButton);

    form.appendChild(chatMessageButtonContainer);
    form.addEventListener("submit", function(event){
        event.preventDefault();
        let msg = input.value;
        socket.emit('chatmessage', msg);
        input.value = "";
        var sentMessage = document.createElement("div");
        sentMessage.className="currentuser";
        var sentMessageText = document.createTextNode(msg);
        sentMessage.appendChild(sentMessageText);
        messages.appendChild(sentMessage);
        return false;
    });
    chatContainer.appendChild(form);
    megacontainer.appendChild(chatContainer);




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
            console.log("tertestest");
            console.log(e.results);
            let result = e.results[counter][0].transcript;
            console.log(result);
            let elem = document.createElement('span');
            elem.innerText = result;
            elem.className = "currentuser";
            messages.appendChild(elem);
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
    var emailInputIcon = document.createElement("img");
    emailInputIcon.src = "https://localhost:16004/mail.svg";
    emailInputIcon.alt="email";
    emailContainer.appendChild(emailInput);
    emailContainer.appendChild(emailInputIcon);
    form.appendChild(emailContainer);

    var passwordContainer = document.createElement("div");
    passwordContainer.className = "input_container";
    var passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.id = "loginpassword";
    passwordInput.placeholder = "Type your password here";
    passwordInput.autocomplete = "on";
    var passwordInputIcon = document.createElement("img");
    passwordInputIcon.src = "https://localhost:16004/key.svg";
    passwordInputIcon.alt = "password";
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
    loginButton.id = "loginButton";
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
                    displaystate = 1;
                    showLoginForm();
                    console.log(result);
                    console.log(result.ActiveUsers);
                    myusername = result.username;
                    showActiveUsers(result.ActiveUsers, result.username);
                    chatbutton.style.display = "none";
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
                    showLoginForm();
                    console.log(result);
                    console.log(result.ActiveUsers);
                    myusername = result.username;
                    showActiveUsers(result.ActiveUsers, result.username);
                    chatbutton.style.display = "none";
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
    var nameInputIcon = document.createElement("img");
    nameInputIcon.src = "https://localhost:16004/person.svg";
    nameInputIcon.alt = "username";
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




function showActiveUsers(activeUsers, username){
    /////////////////////////
    /// Creates the online users sidebar and populates it with the list of active users
    ////////////////////////
    console.log(username);
    let onlineUsersSidebar = document.createElement("div");
        onlineUsersSidebar.id = "onlineUsersSidebar";
    let onlineUsersToolbar = document.createElement("div");
        onlineUsersToolbar.id = "toolbar";
    let closeButton = document.createElement("img");
    closeButton.src = "https://localhost:16004/close.svg";
    closeButton.style = "float:right; font-size: 1.5em; color: white; padding: 5px;";
    closeButton.addEventListener("click", function () {
        onlineUsersSidebar.style.display = "none";
        chatbutton.style.display = "unset";
    });
    onlineUsersToolbar.appendChild(closeButton);
    let onlineUsersContainer = document.createElement("div");
    onlineUsersContainer.id = "onlineUsersContainer";
    console.log(activeUsers);
    for(let i = 0; i < activeUsers.length; i = i + 1){
        if(activeUsers[i].username == username){
            continue
        }
        console.log(activeUsers[i]);
        let User = document.createElement("div");
        User.className = "active";
        onlineUsersContainer.appendChild(User);
        let UserText = document.createTextNode(activeUsers[i].username);
        User.appendChild(UserText);
        let span = document.createElement("span");
        span.className="dot";
        User.appendChild(span);
        User.addEventListener("click", function () {
            startChat(activeUsers[i].username)
        });
        onlineUsersContainer.appendChild(User);
    }
    setInterval(function () {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://localhost:16001/getActiveUsers", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                let result = JSON.parse(xhr.response);
                console.log(result);
                if(result.success === true){
                    displaystate = 1;
                    showLoginForm();
                    console.log(result);
                    console.log(result.ActiveUsers);
                    showActiveUsers(result.ActiveUsers, result.username);
                    let ActiveUsers = JSON.parse(result.ActiveUsers);

                    while (onlineUsersContainer.lastElementChild) {
                        onlineUsersContainer.removeChild(onlineUsersContainer.lastElementChild);
                    }
                    for(let i = 0; i < ActiveUsers.length; i = i + 1){
                        if(ActiveUsers[i].username == username){
                            continue
                        }
                        console.log(ActiveUsers[i]);
                        let User = document.createElement("div");
                        User.className = "active";
                        onlineUsersContainer.appendChild(User);
                        let UserText = document.createTextNode(ActiveUsers[i].username);
                        User.appendChild(UserText);
                        let span = document.createElement("span");
                        span.className="dot";
                        User.appendChild(span);
                        User.addEventListener("click", function () {
                            startChat(ActiveUsers[i].username, username)
                        });
                        onlineUsersContainer.appendChild(User);
                    }
                }
            }
        };
        xhr.send();
    }, 50000);

    onlineUsersSidebar.appendChild(onlineUsersToolbar);
    onlineUsersSidebar.appendChild(onlineUsersContainer);
    document.getElementById("megacontainer").appendChild(onlineUsersSidebar);
}

$('#disconnect').click(function(){
    socket.disconnect();
});


