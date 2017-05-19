/**
 * Created by tfeue on 5/16/2017.
 */
/*global $*/
/*global navigator*/
/*global Peer*/
/*global URL*/

var room = null;
var connections = {};
var calls = {};
var useVoice = false;
var callJoined = false;
var MuteLocal;

$(document).ready(function () {

    MuteLocal = function () {
        window.localStream.getAudioTracks()[0].enabled = !window.localStream.getAudioTracks()[0].enabled;
        $('#mute-button').toggleClass('muted', !window.localStream.getAudioTracks()[0].enabled);
    };

    $('chatbox').hide();

    var room_id = $('#room-id').val();
    var user_id = $('#user-id').val();
    var username = $('#username').val();

    var user_input = $('#user-input');
    var messages = $('#messages');

    var peer = new Peer(user_id, {
        host: window.location.hostname,
        port: window.location.port,
        path: '/peer'
    });

    function sendDisconnect() {
        $.each(Object.keys(room.members), function (i, v) {
            if (v !== user_id) {
                v.send({type: 'disconnect', user_id: user_id});
            }
        });
    }

    $(document).on('beforeunload', function (e) {
        sendDisconnect();
        console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });

    $(document).on('unload', function (e) {
        sendDisconnect();
        console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });

    function joinCall() {
        $.each(Object.keys(room.members), function (i, v) {
            var user = room.members[v];
            if(callJoined){
                if(user.id !== user_id){
                    calls[user.id].close();
                } else {
                    $('#mute-button').remove();
                }
            }
             else {
                if (user.id !== user_id) {
                    if (useVoice) {
                        // var call = peer.call(user.id, window.localStream);
                        // addCallStream(call);
                        user.send({type: 'call-request', user_id: user_id});
                    }
                } else {
                    if (useVoice) {
                        var muteButton = $('<button id="mute-button" onclick="MuteLocal();">').append($('<i class="fa fa-microphone-slash">'));
                        $('#user-' + user.id).append(muteButton);
                    }
                }
            }
        });
        callJoined = !callJoined;
        console.log(callJoined);
    }

    function addUser(user) {
        $('#users').append($('<li class="user" id="user-' + user.id + '">').text(user.name));
    }

    function addCallStream(call) {
        console.log('Call');
        console.log(call);
        call.answer(window.localStream);
        if (calls[call.peer] === undefined) {
            calls[call.peer] = call;
            var user_li = $('#user-' + call.peer);
            console.log('waiting for stream');
            call.on('stream', function (stream) {
                console.log('stream established');
                user_li.append($('<audio controls class="hidden userstream" id="audio-' + call.peer + '" src="' + URL.createObjectURL(stream) + '" autoplay></audio>'));

                // var stream_controls = $('<div class="stream-controls">');
                // var muteButton = $('<button id="mute-' + call.peer + '">').append($('<i class="fa fa-volume-off">'));
                // muteButton.on('click', function () {
                //     console.log(this.id);
                //     var audio_ele = $('#audio'+(this.id).substr((this.id).indexOf('-')));
                //     $(audio_ele).prop('muted', !$(audio_ele).prop('muted'));
                //     $(this).toggleClass('muted');
                // });
                // stream_controls.append(muteButton);
                // user_li.append(stream_controls);
            });
            call.on('close', function () {
                console.log(call.peer + ' has left voice chat');
                delete calls[call.peer];
            });
        }
    }

    function dropUser(id) {
        console.log(id);
        delete room.members[id];
        delete connections[id];
        $('#user-' + id).remove();



        $.ajax({
            url: window.location.protocol + '/updateRoom/' + room_id,
            type: 'post',
            data: {
                room: JSON.stringify(room)
            },
            dataType: 'json',
            success: function (data) {
                console.log(data);
            }
        });
    }

    function addConnEventListeners(conn) {
        conn.on('data', function (data) {
            console.log(data);
            console.log((new Date).getTime());
            decodeData(data);
        });

        conn.on('close', function () {
            console.log(this.peer + ' has left the chat');
            dropUser(this.peer);
        });

        conn.on('error', function (err) {
            console.log(err);
        });
    }

    function addDataConnection(conn) {
        console.log((new Date).getTime());
        console.log('Adding dataConneciton for ' + conn.peer);
        console.log(conn);
        if (conn.open) {
            console.log(conn.peer + '\'s connection is already open');
            console.log((new Date).getTime());
            addConnEventListeners(conn);
            conn.send({type: 'info-request', user_id: user_id});
        } else {
            console.log('Waiting for ' + conn.peer + ' to open connection');
            // addConnEventListeners(conn);
            conn.on('open', function () {
                console.log((new Date).getTime());
                console.log(conn.peer + ' has opened');
                addConnEventListeners(conn);
                conn.send({type: 'info-request', user_id: user_id});
            });
        }
    }

    function autoScroll() {
        messages[0].scrollTop = messages[0].scrollHeight;
    }

    function postError(err) {
        messages.append($('<li class="message error">').text('ERROR: ' + err.msg));
        autoScroll();
    }

    function postMessage(data) {
        messages.append($('<li class="message">').text(room.members[data.user_id].name + ': ' + data.content));
        autoScroll();
    }

    function postWhisper(whisper) {
        messages.append($('<li class="message whisper">').text(((whisper.sender === user_id) ? 'To' : 'From') + ' ' + ((whisper.sender === user_id) ? room.members[whisper.target].name : room.members[whisper.sender].name) + ': ' + whisper.content));
        autoScroll();
    }

    function broadcast(msg) {
        var data = {
            type: 'message',
            user_id: user_id,
            content: msg
        };
        postMessage(data);
        $.each(Object.keys(connections), function (i, v) {
            connections[v].send(data);
        });
    }

    function decodeData(data) {
        console.log("Data: " + data);
        switch (data.type) {
            case 'info-request':
                connections[data.user_id].send({
                    type: 'info-response',
                    user_id: user_id,
                    content: {
                        id: user_id,
                        name: username
                    }
                });
                break;
            case 'info-response':
                room.members[data.user_id] = data.content;
                addUser(data.content);
                break;
            case 'message':
                postMessage(data);
                break;
            case 'whisper':
                postWhisper(data);
                break;
            case 'disconnect':
                console.log(data.user_id + ' requested disconnect');
                dropUser(data.user_id);
                break;
            case 'call-request':
                var call = peer.call(data.user_id, window.localStream);
                addCallStream(call);
                break;
            default:
                console.log(data);
                break;
        }
    }

    function sendMessage(e) {
        e.preventDefault();

        var msg = user_input.val();

        if (msg.indexOf('@') === 0) {
            var splitter = msg.split(' ');
            console.log(splitter);
            if (splitter.length >= 2) {
                if (splitter[0].length === 1) {
                    postError({msg: 'You must supply a username to whisper to.'});
                } else {
                    var unam = splitter[0].substr(msg.indexOf('@') + 1);
                    console.log(unam);
                    if (unam === username) {
                        postError({msg: 'You can\'t whisper to yourself'});
                    } else {
                        var target = null;
                        $.each(Object.keys(room.members), function (i, v) {
                            var v_name = room.members[v].name;
                            console.log(v_name);
                            console.log(v_name === unam);
                            if (target === null && v_name === unam) {
                                target = room.members[v];
                            }
                        });
                        if (target === null) {
                            postError({msg: 'User not found.'});
                        } else {
                            var msg_content = msg.substr(msg.indexOf(splitter[1]));
                            console.log(msg_content);
                            var whisper = {
                                type: 'whisper',
                                content: msg_content,
                                target: target.id,
                                sender: user_id
                            };
                            postWhisper(whisper);
                            connections[target.id].send(whisper);
                        }
                    }
                }
            } else {
                postError({msg: 'You must supply a message'});
            }
        }
        else {
            broadcast(msg);
        }

        user_input.val('');
    }

    function step2() {
        if(useVoice){
            joinCall();
            $('#call').text(callJoined?'Leave Call':'Join Call');
            $('#call').toggleClass('muted');
        } else {
            postError({msg: 'Your Audio Devices are disabled. Cancelling call join.'})
        }
    }

    // function step2() {
        $.ajax({
            url: window.location.protocol + '/getRoom/' + room_id,
            success: function (data) {
                $('#loading').remove();
                room = JSON.parse(data);

                $('#room-name').text(room.name);

                $('#message-box').on('submit', sendMessage);

                console.log(room);

                var join_button = $('<button id="call">');
                join_button.text('Join Call');

                $(join_button).on('click', function () {
                    if(window.localStream === undefined){
                        console.log('getting user media');
                        navigator.getUserMedia({audio: true, video: false}, function (stream) {
                            useVoice = true;
                            window.localStream = stream;
                            step2();
                        }, function () {
                            postError({msg: 'Something went wrong with your input devices. Aborting call'});
                        });
                    } else {
                        console.log('user media already exists');
                        step2();
                    }
                });

                $('#info').append(join_button);

                addUser(room.members[user_id]);

                $.each(Object.keys(room.members), function (i, v) {
                    var mem = room.members[v];
                    // addUser(mem);
                    if (mem.id !== user_id) {
                        console.log('Attempting connection to ' + mem.id);
                        var conn = peer.connect(mem.id);
                        console.log(peer.connections);
                        connections[mem.id] = conn;
                        addDataConnection(conn);
                    }
                });

                $('#chatbox').show();

                peer.on('connection', function (conn) {
                    console.log('PeerID ' + conn.peer + ' is trying to connect');
                    console.log(connections[conn.peer]);
                    if (connections[conn.peer] === undefined || connections[conn.peer] === null) {
                        connections[conn.peer] = conn;
                        addDataConnection(conn);
                    } else {
                        console.warn('PeerID ' + conn.peer + ' already connected');
                    }
                });

                peer.on('call', function (call) {
                    if(useVoice && callJoined){
                        call.answer(window.localStream);
                        addCallStream(call);
                    }
                });

                peer.on('disconnect', function () {
                    console.log('You have been disconnected.');
                });
            }
        });
    // }
});
