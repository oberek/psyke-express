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
// var ChatMethods = {};
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
        $.each(Object.keys(room.online_members), function (i, v) {
            if (v !== user_id) {
                v.send({type: 'disconnect', user_id: user_id});
            }
        });
    }

    $(document).on('beforeunload', function (e) {
        sendDisconnect();
        //console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });

    $(document).on('unload', function (e) {
        sendDisconnect();
        //console.log('.');
        dropUser(user_id);
        peer.disconnect();
        peer.destroy();
        return null;
    });

    function joinCall() {
        $.each(Object.keys(room.online_members), function (i, v) {
            var user = room.online_members[v];
            if (callJoined) {
                if (user.id !== user_id) {
                    if (calls[v] !== undefined) {
                        calls[v].close();
                    }
                } else {
                    $('#mute-button').remove();
                }
            }
            else {
                if (user.id !== user_id) {
                    if (useVoice) {
                        connections[v].send({type: 'call-request', user_id: user_id});
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
        //console.log(callJoined);
    }

    function addUser(user) {
        $('#users').append($('<li class="user" id="user-' + user.id + '">').text(user.name));
    }

    function addSelf(user) {
        $('#users').prepend($('<li class="user self" id="user-' + user.id + '">').text(user.name));
    }

    function addCallStream(call) {
        call.answer(window.localStream);
        if (calls[call.peer] === undefined) {
            calls[call.peer] = call;
            var user_li = $('#user-' + call.peer);
            //console.log('waiting for stream');
            call.on('stream', function (stream) {
                user_li.append($('<audio controls class="hidden userstream" id="audio-' + call.peer + '" src="' + URL.createObjectURL(stream) + '" autoplay></audio>'));
            });
            call.on('close', function () {
                postNotif({msg: room.online_members[call.peer].name + ' has left the call'});
                delete calls[call.peer];
            });
        }
    }

    function dropUser(id) {
        delete room.online_members[id];
        delete connections[id];
        $('#user-' + id).remove();

        $.ajax({
            url: window.location.protocol + '/updateRoom/' + room_id,
            type: 'POST',
            data: {
                room: JSON.stringify(room)
            },
            dataType: 'json',
            success: function (data) {
                console.log('success');
                console.log(data);
            }
        });
    }

    function addConnEventListeners(conn) {
        conn.on('data', function (data) {
            decodeData(data);
        });

        conn.on('close', function () {
            postNotif({msg: room.online_members[this.peer].name + ' has left the chat'});
            dropUser(this.peer);
        });

        conn.on('error', function (err) {
            postError({msg: err});
        });
    }

    function addDataConnection(conn) {
        if (conn.open) {
            addConnEventListeners(conn);
            conn.send({type: 'info-request', user_id: user_id});
        } else {
            conn.on('open', function () {
                addConnEventListeners(conn);
                conn.send({type: 'info-request', user_id: user_id});
            });
        }
    }

    function autoScroll() {
        messages[0].scrollTop = messages[0].scrollHeight;
    }

    postError = function (err) {
        messages.append($('<li class="message error">').text('ERROR: ' + err.msg));
        autoScroll();
    };

    postNotif = function (msg) {
        messages.append($('<li class="message notif">').text('!! ' + msg.msg));
        autoScroll();
    };

    postMessage = function (data) {
        messages.append($('<li class="message">').text(room.online_members[data.user_id].name + ': ' + data.content));
        autoScroll();
    };

    postWhisper = function (whisper) {
        messages.append($('<li class="message whisper">').text(((whisper.sender === user_id) ? 'To' : 'From') + ' ' + ((whisper.sender === user_id) ? room.online_members[whisper.target].name : room.online_members[whisper.sender].name) + ': ' + whisper.content));
        autoScroll();
    };

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
                if (room.online_members[data.user_id] === undefined) {
                    postNotif({msg: data.content.name + ' has joined the chat'});
                }
                room.online_members[data.user_id] = data.content;
                addUser(data.content);
                break;
            case 'message':
                postMessage(data);
                break;
            case 'whisper':
                postWhisper(data);
                break;
            case 'disconnect':
                postNotif({msg: room.online_members[data.user_id].name + ' has left the chat.'});
                dropUser(data.user_id);
                break;
            case 'call-request':
                postNotif({msg: room.online_members[data.user_id].name + ' has joined the call.'});
                if (useVoice && callJoined) {
                    var call = peer.call(data.user_id, window.localStream);
                    addCallStream(call);
                }
                break;
            default:
                postNotif({msg: JSON.stringify(data)});
                break;
        }
    }

    function sendMessage(e) {
        e.preventDefault();
        var msg = user_input.val();
        if (msg.indexOf('@') === 0) {
            var splitter = msg.split(' ');
            if (splitter.length >= 2) {
                if (splitter[0].length === 1) {
                    postError({msg: 'You must supply a username to whisper to.'});
                } else {
                    var unam = splitter[0].substr(msg.indexOf('@') + 1);
                    if (unam === username) {
                        postError({msg: 'You can\'t whisper to yourself'});
                    } else {
                        var target = null;
                        $.each(Object.keys(room.online_members), function (i, v) {
                            var v_name = room.online_members[v].name;
                            if (target === null && v_name === unam) {
                                target = room.online_members[v];
                            }
                        });
                        if (target === null) {
                            postError({msg: 'User not found.'});
                        } else {
                            var msg_content = msg.substr(msg.indexOf(splitter[1]));
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
        if (useVoice) {
            joinCall();
            var call_btn = $('#call');
            call_btn.text(callJoined ? 'Leave Call' : 'Join Call');
            call_btn.toggleClass('muted');
        } else {
            postError({msg: 'Your Audio Devices are disabled. Cancelling call join.'})
        }
    }

    $.ajax({
        url: window.location.protocol + '/getRoom/' + room_id,
        success: function (data) {
            $('#loading').remove();
            room = JSON.parse(data);

            postNotif({msg: 'You joined the chat.'});

            $('#room-name').text(room.name);

            $('#message-box').on('submit', sendMessage);

            console.log(room);

            var join_button = $('<button id="call">');
            join_button.text('Join Call');

            $(join_button).on('click', function () {
                if (window.localStream === undefined) {
                    navigator.getUserMedia({audio: true, video: false}, function (stream) {
                        useVoice = true;
                        window.localStream = stream;
                        step2();
                    }, function () {
                        postError({msg: 'Something went wrong with your input devices. Aborting call\nPlease check your audio devices and make sure your are using https'});
                    });
                } else {
                    step2();
                }
            });

            $('#info').prepend(join_button);

            addSelf(room.online_members[user_id]);

            $.each(Object.keys(room.online_members), function (i, v) {
                var mem = room.online_members[v];
                if (mem.id !== user_id) {
                    var conn = peer.connect(mem.id);
                    connections[mem.id] = conn;
                    addDataConnection(conn);
                }
            });

            $('#chatbox').show();

            peer.on('connection', function (conn) {
                if (connections[conn.peer] === undefined || connections[conn.peer] === null) {
                    connections[conn.peer] = conn;
                    addDataConnection(conn);
                } else {
                    console.warn('PeerID ' + conn.peer + ' already connected');
                }
            });

            peer.on('call', function (call) {
                postNotif({msg: 'PeerID ' + call.peer + ' joined the Call.'});
                if (useVoice && callJoined) {
                    call.answer(window.localStream);
                    addCallStream(call);
                }
            });

            peer.on('disconnect', function () {
                postError({msg: 'You have been disconnected from the server.'});
            });
        }
    });
});
