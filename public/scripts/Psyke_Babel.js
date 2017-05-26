/**
 * Created by tfeue on 5/19/2017.
 */
/*global $*/
/*global Peer*/
/*global React*/
/*global ReactDOM*/

let peer;
let cons = {};
let calls = {};
let useVoice = false;
// let inCall = false;
let URL = window.URL || window.webkitURL;

const server_connection = {
    host: window.location.hostname,
    port: window.location.port,
    path: '/peer'
};

const MODE = {
    LOGIN: 1,
    REGISTER: 3,
    PSYKE: 200,
    PSYKE_DEBUG: 396
};

window.onbeforeunload = function () {
    if (!peer.disconnected) {
        console.log('something');

        $.ajax({
            type: 'post',
            url: '/disconnect',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: peer.id
            }),
            success(data){
                // that.setState({mode: MODE.LOGIN, user: null, peer: that.state.peer});\
                peer.destroy();
            }
        });

        // fetch('/disconnect/' + peer.id).then((res) => {
        //     confirm(res.status);
        // });
    }
};

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function setCookie(cookie_name, cookie_value, exipration_seconds) {
    let d = new Date();
    d.setTime(d.getTime() + (exipration_seconds * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cookie_name + "=" + cookie_value + ";" + expires + ";path=/";
}

function getCookie(cookie_name) {
    let name = cookie_name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function delete_cookie(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

class Login extends React.Component {
    constructor(props) {
        super(props);
        let that = this;
        this.state = {that: that};
    }

    attemptLogin(e) {
        // let component = this;
        // console.log(component);
        e.preventDefault();

        console.log('Attempting login...');
        // console.log(this);
        let that = this;
        let error_container = $('#login-error');
        let z_username = $('#login_username').val().toString();
        let z_password = $('#login_password').val().toString();
        if (z_username === "" || z_password === "") {
            error_container.toggleClass('hidden', false);
            error_container.text('You need to provide a username and password');
        } else {

            $.ajax({
                type: 'POST',
                url: '/login',
                contentType: 'application/json',
                data: JSON.stringify({
                    username: z_username,
                    password: z_password
                }),
                success(data){
                    console.log('Success');
                    console.log(data);
                    let d = JSON.parse(data);
                    setCookie('user', JSON.stringify(d.result), 15 * 60);
                    that.props.login(MODE.PSYKE, d.result);
                },
                error(err){
                    console.log('err');
                    console.log(err);
                }
            });

            // fetch('/login/' + z_username + '/' + z_password)
            //     .then(res => res.json())
            //     .then((d) => {
            //         console.log(d);
            //         if (d.result) {
            //             //do something
            //             setCookie('user', JSON.stringify(d.result), 15 * 60);
            //             this.props.login(MODE.PSYKE, d.result);
            //         } else {
            //             error_container.text('Username or Password are incorrect');
            //             error_container.toggleClass('hidden', false);
            //         }
            //     });
        }
    }

    render() {
        return (
            <div className="container">
                <span id="login-error" className="hidden">errors go here</span>
                <form onSubmit={this.attemptLogin.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="username">Username: </label>
                        <input id="login_username" className="form-control" name="username" type="text"
                               placeholder="Username" required=""/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password: </label>
                        <input id="login_password" className="form-control" name="password" type="password"
                               placeholder="Password" required=""/>
                    </div>
                    <input className="btn btn-success" type="submit" value="Submit"
                           onClick={this.attemptLogin.bind(this)}/>
                </form>
                <button className="btn btn-primary">Register</button>
            </div>
        );
    };
}

class Example extends React.Component {
    state = {users: [], rooms: {}};

    componentDidMount() {
        fetch('/users')
            .then(res => res.json())
            .then(users => {
                fetch('/rooms')
                    .then(res => res.json())
                    .then(rooms => this.setState({users, rooms}));
            });
    }

    render() {
        return (
            <div className="App">
                <h1>Users</h1>
                {this.state.users.map(user =>
                    <div key={user.id}>Username: {user.username}
                        <br/>
                        Rooms:
                        <ul className="rooms">
                            {user.rooms.map(room_id => {
                                return (<li key={room_id}>{this.state.rooms[room_id].room_name}</li>);
                            })}
                        </ul>
                    </div>
                )}
            </div>
        );
    }
}

class Psyke extends React.Component {
    state = {current_room: null, rooms: []};

    componentDidMount() {
        let user = this.props.user;
        let that = this;
        $.ajax({
            type: 'POST',
            url: '/getUserRooms',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: user.id
            }),
            success(data){
                console.log('Success');
                console.log(data);
                let r = JSON.parse(data);

                let rms = [];
                $.each(r, (i, v) => {
                    rms.push(v);
                });
                that.setState({
                    current_room: rms[0].room_id,
                    rooms: rms
                });

                // let d = JSON.parse(data);
                // setCookie('user', JSON.stringify(d.result), 15 * 60);
                // that.props.login(MODE.PSYKE, d.result);
            },
            error(err){
                console.log('err');
                console.log(err);
            }
        });
    }

    updateCurrentRoom(room_id) {
        this.setState({current_room: room_id, rooms: this.state.rooms});
        console.log('should update chat container props');
    }

    render() {
        return (
            <div id="app-container">
                <div className="header text-center">
                    {/*<h1>Psyke!</h1>*/}
                    <h3>Welcome, {this.props.user.username}!</h3>
                    <button className="btn btn-danger center-btn" onClick={this.props.logout}>Logout</button>
                </div>
                <div className="content">
                    <RoomRack key={'RoomRack' + this.props.user.id} current_room={this.state.current_room}
                              rooms={this.state.rooms}
                              updateCurrentRoom={this.updateCurrentRoom.bind(this)}/>
                    <ChatContainer key={'ChatContainer' + this.props.user.id} peer={this.props.peer}
                                   user={this.props.user} current_room={this.state.current_room}/>
                </div>
            </div>
        );
    }
}

class RoomRack extends React.Component {
    state = {current_room: null, rooms: []};

    updateCurrentRoom(room_id) {
        console.log(room_id);
        this.setState({current_room: room_id, rooms: this.state.rooms});
        this.props.updateCurrentRoom(room_id);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({current_room: nextProps.current_room, rooms: nextProps.rooms});
    }

    render() {
        return (
            <div id="room-rack">
                <h4>Room Rack</h4>
                {/*eventually turn the list into a list of new components, but a list of names is good for now*/}
                <ul id="room-list">
                    {this.state.rooms.map((room) => {
                        return (<li key={room.room_id}>
                            <button id={room.room_id}
                                    className={(this.state.current_room === room.room_id ? "current " : "") + "room btn"}
                                    onClick={() => this.updateCurrentRoom(room.room_id)}>
                                {room.room_name}
                            </button>
                        </li>);
                    })}
                </ul>
            </div>
        );
    }
}

class Notification extends React.Component {
    render() {
        return (
            <li className="message notif">!! {this.props.message}</li>
        );
    }
}

class ErrorMsg extends React.Component {
    render() {
        return (
            <li className="message error">Error: {this.props.message}</li>
        );
    }
}

class Whisper extends React.Component {
    render() {
        return (
            <li className="message whisper">{((this.props.sender === this.props.peer.id) ? "To " + this.props.room.users[this.props.target] : "From " + this.props.room.users[this.props.sender])} {this.props.message}</li>
        );
    }
}

class Message extends React.Component {
    render() {
        return (
            <li className="message">{this.props.room.users[this.props.sender].username}: {this.props.message}</li>
        );
    }
}

// class UserLi extends React.Component{
//     render(){
//         if(this.props.inCall){
//             if(this.props.localUser===this.props.user.id){
//                 //it's the local user... add the mute button
//             } else {
//                 return(
//                     //localUser={this.props.peer.id} inCall={this.state.room.inCall} user={user}
//                     <li className="user">
//                         {this.props.user.username}
//                         <audio src={this.props.call.s}></audio>
//                     </li>
//                 );
//             }
//         } else {
//             return(
//                 //localUser={this.props.peer.id} inCall={this.state.room.inCall} user={user}
//                 <li className="user">
//                     {this.props.user.username}
//                 </li>
//             );
//         }
//     }
// }

class MuteButton extends React.Component {
    state = {muted: false};

    MuteLocal() {
        let that = this;
        window.localStream.getAudioTracks()[0].enabled = !window.localStream.getAudioTracks()[0].enabled;
        that.state.muted = !window.localStream.getAudioTracks()[0].enabled;
        that.setState(that.state);
    }

    render() {
        return (
            <button onClick={this.MuteLocal} className={this.state.muted ? 'muted' : ''}>
                <i className="fa fa-microphone-slash"></i>
            </button>
        );
    }
}

class ChatContainer extends React.Component {
    state = {room: {users: {}, log: [], inCall: false, streams: []}};

    decodeData(data) {
        let that = this;
        console.log(data);
        switch (data.type) {
            case 'info-request':
                cons[data.user_id].send({
                    type: 'info-response',
                    user: {
                        id: that.props.user.id,
                        username: that.props.user.username
                    }
                });
                break;
            case 'info-response':
                if (this.state.room.users[data.user.id] === undefined) {
                    // postNotif({msg: data.content.name + ' has joined the chat'});
                    console.log('user info added');
                    let room = that.state.room;
                    room.inCall = false;
                    room.users[data.user.id] = data.user;
                    that.setState({room: room});
                    // that.forceUpdate();
                }
                // room.online_members[data.user_id] = data.content;
                // addUser(data.content);
                break;
            case 'message':
                // postMessage(data);
                that.state.room.log.push(data);
                break;
            case 'whisper':
                // postWhisper(data);
                that.state.room.log.push(data);
                that.forceUpdate();
                break;
            case 'disconnect':
                // postNotif({msg: room.online_members[data.user_id].name + ' has left the chat.'});
                // dropUser(data.user_id);
                break;
            case 'call-request':
                // postNotif({msg: room.online_members[data.user_id].name + ' has joined the call.'});
                if (useVoice && that.state.room.inCall) {
                    let call = peer.call(data.user_id, window.localStream);
                    that.addCallStream(call);
                }
                break;
            default:
                // postNotif({msg: JSON.stringify(data)});
                break;
        }
    }

    addCallStream(call) {
        let that = this;
        call.answer(window.localStream);
        if (calls[call.peer] === undefined) {
            calls[call.peer] = call;
            // var user_li = $('#user-' + call.peer);
            //console.log('waiting for stream');
            call.on('stream', function (stream) {
                // user_li.append($('<audio controls class="hidden userstream" id="audio-' + call.peer + '" src="' + URL.createObjectURL(stream) + '" autoplay></audio>'));
                // $('#user-'+call.peer).append(<audio id={'stream-'+call.peer} autoPlay={true} src={URL.createObjectURL(stream)}>User Stream</audio>);
                let str = {
                    id: call.peer,
                    stream: URL.createObjectURL(stream)
                };
                that.state.room.streams.push(str);
                that.setState(stream);
                // that.forceUpdate();
            });
            call.on('close', function () {
                $('#stream-' + call.peer).remove();
                // postNotif({msg: room.online_members[call.peer].name + ' has left the call'});
                delete calls[call.peer];
            });
        }
    }

    addConnEventListeners(conn) {
        let that = this;
        conn.on('data', function (data) {
            that.decodeData(data);
        });

        conn.on('close', function () {
            // postNotif({msg: room.online_members[this.peer].name + ' has left the chat'});
            // dropUser(this.peer);
            console.log(conn.peer, 'has disconnected');
            var new_state = Object.assign({}, that.state);
            delete new_state.room.users[conn.peer];
            that.setState(new_state);
        });

        conn.on('error', function (err) {
            // postError({msg: err});
            console.log(err);
        });
    }

    addDataConnection(conn) {
        cons[conn.peer] = conn;
        let that = this;
        if (conn.open) {
            that.addConnEventListeners(conn);
            conn.send({type: 'info-request', user_id: peer.id});
        } else {
            conn.on('open', function () {
                that.addConnEventListeners(conn);
                conn.send({type: 'info-request', user_id: peer.id});
            });
        }
    }

    peerSetup(p) {
        let that = this;
        if (p instanceof Peer) {
            p.on('connection', function (conn) {
                console.log('Peer with id (' + conn.peer + ') has connected to you');
                that.addDataConnection(conn);
                conn.send({type: 'info-request', user_id: p.id});
            });

            p.on('call', function (call) {
                if (that.state.room.inCall) {
                    that.addCallStream(call);
                } else {
                    call.answer(null);
                    call.close();
                }
            });
        }
    }

    componentDidMount() {
        console.log(this.props);
        this.peerSetup(this.props.peer);
    }

    componentWillReceiveProps(nextProps) {
        let that = this;
        console.log('ChatComponent - componentWillReceiveProps');
        // $.each(Object.values(cons), function (i, v) {
        //     console.log(v);
        // });

        $.each(Object.keys(cons), function (i, v) {
            cons[v].close();
            delete cons[v];
        });

        $.ajax({
            type: 'POST',
            url: '/connect',
            contentType: 'application/json',
            data: JSON.stringify({
                room_id: nextProps.current_room,
                user_id: nextProps.user.id
            }),
            success(data) {
                console.log('Success');
                console.log(data);
                console.log(JSON.parse(data));
                var r = JSON.parse(data);
                console.log('connected local user to the room with id ' + nextProps.current_room);
                r.users = {};
                r.streams = [];
                r.users[nextProps.user.id] = nextProps.user;
                that.setState({room: r});
                console.log(r);

                $.each(r.online_members, function (i, peer_id) {
                    console.log(peer_id, peer.id);
                    if (peer_id !== nextProps.peer.id) {
                        that.addDataConnection(peer.connect(peer_id));
                    } else {
                        console.log('add self to users list');
                    }
                });

            }
        });
    }

    joinCall() {
        let that = this;

        function step2() {
            if (useVoice) {
                $.each(Object.values(cons), function (i, conn) {
                    console.log(conn);
                    if (that.state.room.inCall) {
                        //disconnect from the call
                    } else {
                        //request the other peer to call me
                        conn.send({type: 'call-request', user_id: that.props.peer.id});
                    }
                });
                that.state.room.inCall = !that.state.room.inCall;
                that.setState(that.state);
                // that.setState({room: that.state.room, inCall: !that.state.inCall, useVoice: that.state.useVoice});
            } else {
                console.log('useVoice is false');
            }
            // that.forceUpdate();
        }

        if (window.localStream === undefined) {
            navigator.getUserMedia({audio: true, video: false}, function (stream) {
                useVoice = true;
                window.localStream = stream;
                step2();
            }, function () {
                // this.postError({msg: 'Something went wrong with your input devices. Aborting call\nPlease check your audio devices and make sure your are using https'});
                // console.log()
                alert('shit happened');
            });
        } else {
            console.log('window.localStream already initialized');
            step2();
        }
    }

    render() {
        return (
            <div id="chat-container">
                <div id="chat">
                    {/*<h3>Chatlog for {this.state.room.room_name}</h3>*/}
                    <ul id="messages">
                        {this.state.room.log.map((msg) => {
                            switch (msg.type) {
                                case 'msg':
                                    return <Message key={msg.timestamp} room={this.state.room} sender={msg.sender}
                                                    message={msg.msg}/>;
                                    break;
                                case 'whisper':
                                    return <Whisper key={msg.timestamp} room={this.state.room} sender={msg.sender}
                                                    target={msg.target} message={msg.msg}/>;
                                    break;
                                case 'notif':
                                    return <Notification key={msg.timestamp} message={msg.msg}/>;
                                    break;
                                case 'error':
                                    return <ErrorMsg key={msg.timestamp} message={msg.msg}/>;
                                    break;
                            }
                        })}
                    </ul>
                    <form action="">
                        <input type="text" required={true} autoComplete="off" placeholder="Enter Message here, or @USERNAME to whisper someone"/>
                        <input type="file" accept="image/*|audio/*|video/*"/>
                        <button id="send-message" onClick={console.log('send-message onClick')}>Send</button>
                    </form>
                </div>
                <div id="user-rack">
                    <button id="call" className={(this.state.room.inCall) ? "muted" : ""}
                            onClick={this.joinCall.bind(this)}>{(this.state.room.inCall) ? "Leave Call" : "Join Call"}</button>
                    <h3>Users</h3>
                    <ul id="current-users">
                        {Object.values(this.state.room.users).map((user) => {
                            return (
                                //localUser={this.props.peer.id} inCall={this.state.room.inCall} user={user}
                                <li key={user.id} id={"user-" + user.id} className="user">
                                    {user.username}
                                    {this.state.room.inCall ? peer.id === user.id ? <MuteButton /> : '' : ''}
                                </li>
                            );
                        })}
                    </ul>
                    <ul className="streams">
                        {(this.state.room.streams).map((str) => {
                            return (
                                <audio key={str.id} id={"stream-" + str.id} src={str.stream} autoPlay={true}>
                                    Stream</audio>
                            );
                        })}
                    </ul>
                </div>
            </div>
        );
    }
}

class App extends React.Component {
    state = {mode: MODE.LOGIN, user: null, peer: null};

    componentDidMount() {
        let cookie_data = getCookie('user');
        if (cookie_data) {
            let user = JSON.parse(cookie_data);
            // this.setState({mode: MODE.PSYKE, user: user});
            peer = new Peer(user.id, server_connection);
            this.setState({mode: MODE.PSYKE, user: user, peer: peer});
        }
    }

    newUser() {
        this.setState({mode: MODE.REGISTER, user: null});
    }

    logout() {
        delete_cookie('user');
        let that = this;

        $.ajax({
            type: 'post',
            url: '/disconnect',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: this.state.user.id
            }),
            success(data){
                that.setState({mode: MODE.LOGIN, user: null, peer: that.state.peer});
            }
        });

        $.each(Object.keys(cons), function (i, v) {
            cons[v].close();
            delete cons[v];
        });

        peer.destroy();
    }

    login(mode, user) {
        peer = new Peer(user.id, server_connection);
        this.setState({mode: mode, user: user, peer: peer});
    }

    rendererMode() {
        switch (this.state.mode) {
            case MODE.LOGIN:
                return <Login newUser={this.newUser.bind(this)} login={this.login.bind(this)}/>;
            case MODE.PSYKE:
                return <Psyke key={this.state.user.id} logout={this.logout.bind(this)} user={this.state.user}
                              peer={this.state.peer}/>;
            case MODE.PSYKE_DEBUG:
                return <Example/>;
            default:
                return <Example/>;
        }
    }

    render() {
        return (
            (this.rendererMode())
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));