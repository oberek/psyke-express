/**
 * Created by tfeue on 5/19/2017.
 */
/*global $*/
/*global Peer*/
/*global React*/
/*global ReactDOM*/
/*global navigator*/

let peer;
let cons = {};
let calls = {};
let useVoice = false;
let connectionAttempts = 0;
let recon;

let URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
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

function inputValidator(evt){
    let tar = evt.target;
    tar.value = tar.value.replace(/\W+/g, "");
}

window.onbeforeunload = function () {
    if (!peer.disconnected) {
        $.ajax({
            type: 'post',
            url: '/disconnect',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: peer.id
            }),
            success() {
                peer.destroy();
            }
        });
    }
};

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function setCookie(cookie_name, cookie_value, expiration_seconds) {
    let d = new Date();
    d.setTime(d.getTime() + ( expiration_seconds * 1000));
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

class ErrorAlert extends React.Component{
    render() {
        return(
            <div className="alert alert-danger alert-dismissable fade in">
                <strong>Error!</strong> {this.props.msg} <a href="#" className="close" data-dismiss="alert" aria-label="close">&times;</a>
            </div>
        );
    }
}

class WarningAlert extends React.Component{
    render() {
        return(
            <div className="alert alert-warning alert-dismissable fade in">
                <strong>Error!</strong> {this.props.msg} <a href="#" className="close" data-dismiss="alert" aria-label="close">&times;</a>
            </div>
        );
    }
}

class Login extends React.Component {
    state = {error: null};
    attemptLogin(e) {
        e.preventDefault();
        let that = this;
        let z_username = $('#login_username').val().toString();
        let z_password = $('#login_password').val().toString();
        z_password = CryptoJS.SHA256(z_password).toString();
        if (z_username === "" || z_password === CryptoJS.SHA256("").toString()) {
            this.setState({
                error: <ErrorAlert msg="You need to provide a username and password" />
            });
        } else {
            $.ajax({
                type: 'POST',
                url: '/login',
                contentType: 'application/json',
                data: JSON.stringify({
                    username: z_username,
                    password:z_password
                }),
                success(data) {
                    let d = JSON.parse(data);
                    setCookie('user', JSON.stringify(d), 15 * 60);
                    that.props.login(MODE.PSYKE, d);
                },
                error(err) {
                    if(err.status === 403){
                        that.setState({
                            error: <ErrorAlert msg="Invalid username or password"/>
                        });
                    } else if(err.status === 404){
                        that.setState({
                            error: <ErrorAlert msg="No user with that username exists."/>
                        });
                    }
                }
            });
        }
    }

    registerOnClickHandler() {
        let that = this;
        return (
            function () {
                that.props.swapMode(MODE.REGISTER);
            }
        );
    }

    componentDidMount() {
        $('#login-form').validator();
    }

    render() {
        return (
            <div className="container">
                <h1>Login</h1>
                <div id="login-errors">
                    {(this.state.error === undefined)?"":this.state.error}
                </div>
                <form id="login-form" data-toggle="validator" onSubmit={this.attemptLogin.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="username"> Username: </label>
                        <input id="login_username" className="form-control" name="username" type="text" placeholder="Username" required/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password"> Password: </label> <input id="login_password" className="form-control" name="password" type="password" placeholder="Password" required/>
                    </div>
                    <input className="btn btn-success" type="submit" value="Submit" onClick={ this.attemptLogin.bind(this) }/>
                </form>
                <button className="btn btn-primary" onClick={this.registerOnClickHandler()}> Register</button>
            </div>
        );
    };
}

class Register extends React.Component {
    constructor(props) {
        super(props);
        let that = this;
        this.state = {
            that: that
        };
    }

    attemptRegister(e) {
        e.preventDefault();
        let that = this;
        let z_username = $('#register_username').val().toString();
        let z_password = $('#register_password').val().toString();
        let pass_confirm = $('#inputPasswordConfirm').val().toString();
        // z_password = CryptoJS.SHA256(z_password).toString();
        // pass_confirm = CryptoJS.SHA256(pass_confirm).toString();
        let passHash = CryptoJS.SHA256(z_password).toString();
        if(pass_confirm === ""){
            that.setState({
                error: <ErrorAlert msg="Please confirm your password" />
            });
        } else if (z_username === "" || z_password === "") {
            that.setState({
                error: <ErrorAlert msg="You need to provide a username and password"/>
            });
        } else if(z_password !== pass_confirm){
            that.setState({
                error: <ErrorAlert msg="Passwords do not match!"/>
            });
        } else {
            $.ajax({
                type: 'POST',
                url: '/register',
                contentType: 'application/json',
                data: JSON.stringify({
                    username: z_username,
                    password: passHash
                }),
                success(data) {
                    let d = JSON.parse(data);
                    setCookie('user', JSON.stringify(d), 15 * 60);
                    that.props.register(MODE.PSYKE, d);
                },
                error(err) {
                    console.error("Error: ", err);
                    if(err.status === 403){
                        that.setState({
                            error: <WarningAlert msg="Username is already taken"/>
                        });
                    }
                }
            });
        }
    }

    loginOnClickHandler() {
        let that = this;
        return (
            function () {
                that.props.swapMode(MODE.LOGIN);
            }
        );
    }

    componentDidMount() {
        $('#register-form').validator();
    }

    render() {
        return (
            <div className="container">
                <h1>Register</h1>
                <div id="register-errors">
                </div>
                <form id="register-form" data-toggle="validator" role="form"
                      onSubmit={ this.attemptRegister.bind(this) }>
                    <div className="form-group">
                        <label htmlFor="register_username" className="control-label">Username</label>
                        <input type="text" className="form-control" id="register_username" placeholder="Username" onChange={inputValidator} required/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="register_password" className="control-label">Password</label>
                        <div className="form-inline row">
                            <div className="form-group col-sm-6">
                                <input type="password" data-minlength="6" className="form-control"
                                       id="register_password" placeholder="Password" required/>
                                <div className="help-block">Minimum of 6 characters</div>
                            </div>
                            <div className="form-group col-sm-6">
                                <input type="password" className="form-control" id="inputPasswordConfirm"
                                       data-match="#register_password" data-match-error="Whoops, these don't match"
                                       placeholder="Confirm" required/>
                                <div className="help-block with-errors">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <input className="btn btn-success" type="submit" value="Submit"/>
                    </div>
                </form>

                <button className="btn btn-primary" onClick={this.loginOnClickHandler()}> Login</button>
            </div>
        );
    };
}

class Psyke extends React.Component {
    state = {
        current_room: null,
        rooms: null
    };

    addNewRoom(room){
        this.state.rooms.push(room);
        let user = Object.assign({}, this.props.user);
        user.rooms.push(room);
        delete_cookie('user');
        setCookie('user', user, 5*60*1000);
        this.setState(this.state);
    }

    componentDidMount() {
        let user = this.props.user;
        let that = this;
        that.state.current_room = user.rooms[0]._id;
        that.state.rooms = user.rooms;
        that.setState(that.state);
    }

    updateCurrentRoom(_id) {
        this.setState({
            current_room: _id,
            rooms: this.state.rooms
        });
    }

    render() {
        return (
            <div id="app-container">
                <div className="header text-center"> { /*<h1>Psyke!</h1>*/ } <h3>
                    Welcome, {this.props.user.username}! </h3>
                    <button className="btn btn-danger center-btn" onClick={ this.props.logout }> Logout</button>
                </div>
                <div className="content">
                    <RoomRack key={ 'RoomRack' + this.props.user._id }
                              current_room={ this.state.current_room }
                              rooms={ this.state.rooms }
                              user_id={this.props.user._id}
                              addNewRoom={ this.addNewRoom.bind(this) }
                              updateCurrentRoom={ this.updateCurrentRoom.bind(this) }/>
                    <ChatContainer key={'ChatContainer' + this.props.user._id }
                                   peer={this.props.peer}
                                   user={this.props.user}
                                   swapMode={this.props.swapMode.bind(this)}
                                   current_room={this.state.current_room}/>
                </div>
            </div>
        );
    }
}

class RoomRack extends React.Component {
    state = {
        current_room: null,
        rooms: [],
        errors: {
            newRoom: false,
            joinRoom: false
        }
    };

    updateCurrentRoom(_id) {
        this.setState({
            current_room: _id,
            rooms: this.state.rooms,
            errors: this.state.errors
        });
        this.props.updateCurrentRoom(_id);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            current_room: nextProps.current_room,
            rooms: nextProps.rooms,
            errors: this.state.errors
        });
        this.forceUpdate();
    }


    componentDidMount() {
        $('#new-room-form').validator();
        $('#join-room-form').validator();
    }

    joinExisting(e){
        e.preventDefault();
        let that = this;
        let joinRoomInput = $('#join-room-input');
        let newRoomInput = $('#new-room-input');
        let room_name = joinRoomInput.val();
        if(room_name.length > 0){
            $.ajax({
                url: '/joinRoom',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    room_name: room_name,
                    user_id: that.props.user_id
                }),
                success(data){
                    let room = JSON.parse(data);
                    joinRoomInput.val('');
                    newRoomInput.val('');
                    $('#newRoomModal').modal('toggle');
                    that.props.addNewRoom(room);
                },
                error(err){
                    if(err.status === 404){
                        that.state.errors.joinRoom = <WarningAlert msg="No room with that name exists"/>;
                    } else if(err.status === 403){
                        that.state.errors.joinRoom = <WarningAlert msg="You have already joined that room."/>;
                    } else {
                        that.state.errors.joinRoom = <ErrorAlert msg="CRITICAL ERROR: See console for detailed information"/>;
                    }
                    that.setState(that.state);
                }
            });
        } else {
            that.state.errors.joinRoom = <WarningAlert msg="You must provide a name for the room."/>;
            that.setState(that.state);
        }
    }

    newRoom(e){
        e.preventDefault();
        let that = this;
        let joinRoomInput = $('#join-room-input');
        let newRoomInput = $('#new-room-input');
        let room_name = newRoomInput.val();
        if(room_name.length > 3){
            $.ajax({
                url: '/newRoom',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    room_name: room_name,
                    user_id: that.props.user_id
                }),
                success(data){
                    let room = JSON.parse(data);
                    that.props.addNewRoom(room);
                    joinRoomInput.val('');
                    newRoomInput.val('');
                    $('#newRoomModal').modal('toggle');
                },
                error(err){
                    if(err.status === 403){
                        that.state.errors.newRoom = <WarningAlert msg="A Room already exists with that name"/>;
                        that.setState(that.state);
                    }
                }
            });
        } else {
            that.state.errors.joinRoom = <WarningAlert msg="You must provide a name for the room."/>;
            that.setState(that.state);
        }
    }

    render() {
        return (
            <div id="room-rack">
                <h4> Room Rack </h4>
                <ul id="room-list"> {
                    this.state.rooms.map((room) => {
                        return (
                            <li key={ room._id }>
                                <button id={ room._id } className={ ((this.state.current_room === room._id) ? "current " : "") + "room btn" } onClick={ () => this.updateCurrentRoom(room._id) }>
                                    { room.room_name }
                                </button>
                            </li>
                        );
                    })
                } </ul>
                <div className="wrapper">
                </div>
                <div id="newRoomBtn" className="text-center">
                    <button type="button" className="btn btn-info btn-lg text-center" data-toggle="modal" data-target="#newRoomModal">+</button>
                </div>

                {/*<!-- Modal -->*/}
                <div className="modal fade" id="newRoomModal" role="dialog">
                    <div className="modal-dialog">
                        {/*<!-- Modal content-->*/}
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">Create a Room</h4>
                            </div>
                            <div className="modal-body">
                                <div id="join-room-errors">
                                    {(this.state.errors.joinRoom)?this.state.errors.joinRoom:""}
                                </div>
                                <h3>Join an Existing Room</h3>
                                <form id="join-room-form" role="form" data-toggle="validator"  onSubmit={this.joinExisting.bind(this)}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="join-room-input">Enter the Room's Name here:</label>
                                        <input id="join-room-input" className="form-control" type="text" required placeholder="Cuzco's Old Room" />
                                    </div>
                                    <button type="submit" className="btn btn-success">Submit</button>
                                </form>
                                <hr />
                                <div id="new-room-errors">
                                    {(this.state.errors.newRoom)?this.state.errors.newRoom:""}
                                </div>
                                <h3>Create a New Room</h3>
                                <form id="new-room-form" role="form" data-toggle="validator" onSubmit={this.newRoom.bind(this)}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="new-room-input">Enter a name for your Room here:</label>
                                        <input id="new-room-input" className="form-control" type="text" required placeholder="Cuzco's New Room"/>
                                    </div>
                                    <button type="submit" className="btn btn-success">Submit</button>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class Notification extends React.Component {
    render() {
        return ( <li className="message notif"><strong>!!</strong> { this.props.message } </li> );
    }
}

class ErrorMsg extends React.Component {
    render() {
        return ( <li className="message error"> Error: { this.props.message } </li>);
    }
}

class Whisper extends React.Component {
    render() {
        return (
            <li className="message whisper">
                {((this.props.sender._id === peer.id) ?
                    "To " + this.props.target.username :
                    "From " + this.props.sender.username)}: {this.props.message}
            </li>);
    }
}

class Message extends React.Component {
    render() {
        return ( <li className="message"> {
            this.props.sender.username
        }: {
            this.props.message
        } </li>);
    }
}

class ChatContainer extends React.Component {
    state = {
        room: {
            users: {},
            log: [{type: "notif", msg: "Welcome to the chat!", timestamp: (new Date()).toUTCString()}],
            inCall: false,
            streams: []
        }
    };

    componentDidMount() {
        this.peerSetup(this.props.peer);
    }

    componentWillReceiveProps(nextProps) {
        let that = this;

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
                user_id: nextProps.user._id
            }),
            success(data) {
                let r = JSON.parse(data);
                r.users = {};
                r.streams = [];
                r.users[nextProps.user._id] = nextProps.user;
                r.log.unshift(that.state.room.log[0]);
                that.state.room = r;
                that.setState(that.state);

                $.each(r.online_members, function (i, peer_id) {
                    if (peer_id !== nextProps.peer.id) {
                        let conn = peer.connect(peer_id);
                        that.addDataConnection(conn);
                    } else {
                    }
                });

            }
        });
    }

    decodeData(data) {
        let that = this;
        switch (data.type) {
            case 'info-request':
                cons[data.user_id].send({
                    type: 'info-response',
                    user: {
                        _id: that.props.user._id,
                        username: that.props.user.username
                    },
                    timestamp: (new Date()).toUTCString()
                });
                break;
            case 'info-response':
                if (this.state.room.users[data.user._id] === undefined) {
                    if (this.state.room.online_members.indexOf(data.user._id) === -1) {
                        that.postNewData({
                            msg: data.user.username + ' has joined the chat',
                            type: 'notif',
                            timestamp: (new Date()).toUTCString()
                        });
                    }
                    let room = that.state.room;
                    room.users[data.user._id] = data.user;
                    that.setState({room: room});
                }
                break;
            case 'message':
            case 'whisper':
                that.postNewData(data);
                break;
            case 'disconnect':
                that.postNewData({
                    msg: that.state.room.users[data.user_id].username + ' has left the chat.',
                    type: 'notif',
                    timestamp: (new Date()).toUTCString()
                });
                break;
            case 'call-request':
                that.postNewData({
                    msg: that.state.room.users[data.user_id].username + ' has joined the call.',
                    type: 'notif',
                    timestamp: (new Date()).toUTCString()
                });
                if (useVoice && that.state.room.inCall) {
                    let call = peer.call(data.user_id, window.localStream);
                    that.addCallStream(call);
                }
                break;
            case 'hangup':
                that.postNewData({
                    msg: that.state.room.users[data.user._id].username + ' has left the call.',
                    type: 'notif',
                    timestamp: (new Date()).toUTCString()
                });
                if (calls[data.user._id] !== undefined) {
                    calls[data.user._id].close();
                    delete calls[data.user._id];
                }
                break;
            default:
                that.postNewData({
                    msg: JSON.stringify(data),
                    type: 'err',
                    timestamp: (new Date()).toUTCString()
                });
                break;
        }
    }

    addCallStream(call) {
        let that = this;
        call.answer(window.localStream);
        if (calls[call.peer] === undefined) {
            calls[call.peer] = call;
            call.on('stream', function (stream) {
                let str = {
                    id: call.peer,
                    stream: URL.createObjectURL(stream)
                };
                that.state.room.streams.push(str);
                that.setState(that.state);
            });
            call.on('close', function () {
                $('#stream-' + call.peer).remove();
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
            if(that.state.room.users[conn.peer] !== undefined){
                that.postNewData({
                    msg: that.state.room.users[conn.peer].username + ' has left the chat',
                    type: 'notif',
                    timestamp: (new Date()).toUTCString()
                });
                let new_state = Object.assign({}, that.state);
                delete new_state.room.users[conn.peer];
                that.setState(new_state);
            } else {
                if(cons[conn.peer] !== undefined){
                    delete  cons[conn.peer];
                }
            }
        });

        conn.on('error', function (err) {
            that.postNewData({msg: err, type: 'err', timestamp: (new Date()).toUTCString()});
        });
    }

    addDataConnection(conn) {
        let that = this;
        cons[conn.peer] = conn;
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
            p.on('disconnected', function () {
                if(recon === undefined){
                    that.postNewData({
                        type: 'notif',
                        msg: "You have been disconnected from the server",
                        timestamp: (new Date()).toUTCString()
                    });
                    recon = setInterval(function () {
                        if(p.disconnected && connectionAttempts < 5){
                            connectionAttempts++;
                            that.postNewData({
                                type: 'notif',
                                msg: "Attempting to reconnect... ("+(connectionAttempts)+")",
                                timestamp: (new Date()).toUTCString()
                            });
                            p.reconnect()
                        } else if(connectionAttempts >= 5 && p.disconnected){
                            clearInterval(recon);
                            recon = undefined;
                            that.postNewData({
                                type: 'error',
                                msg: "Lost Connection to the Server. Logging out.",
                                timestamp: (new Date()).toUTCString()
                            });
                            connectionAttempts = 0;
                            alert('Lost Connection to the Server.');
                            delete_cookie("user");
                            setTimeout(function () {
                                that.props.swapMode(MODE.LOGIN);
                            }, 2000);
                        } else if(!p.disconnected){
                            clearInterval(recon);
                            recon = undefined;
                            connectionAttempts = 0;
                            that.postNewData({
                                type: 'notif',
                                msg: "You have been reconnected to the server.",
                                timestamp: (new Date()).toUTCString()
                            });
                        }
                    }, 3000);
                }
            });

            p.on('connection', function (conn) {
                that.addDataConnection(conn);
                conn.send({type: 'info-request', user_id: p._id});
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

    joinCall() {
        let that = this;

        function step2() {
            if (useVoice) {
                $.each(Object.values(cons), function (i, conn) {
                    if (that.state.room.inCall) {
                        cons[conn.peer].send({type: 'hangup', user: that.state.room.users[that.props.peer.id]})
                        delete calls[conn.peer];
                    } else {
                        conn.send({type: 'call-request', user_id: that.props.peer.id});
                    }
                });
                that.state.room.inCall = !that.state.room.inCall;
                that.setState(that.state);
            }
        }

        if (window.localStream === undefined) {
            navigator.getUserMedia({audio: true, video: false}, function (stream) {
                useVoice = true;
                window.localStream = stream;
                step2();
            }, function () {
                that.postNewData(
                    {
                        type: 'error',
                        msg: 'Something went wrong with your input devices. Aborting call\nPlease check your audio devices and make sure your are using https',
                        timestamp: (new Date()).toUTCString()
                    });
                console.error('shit happened');
            });
        } else {
            step2();
        }
    }

    autoScroll() {
        let messages = $('#messages');
        messages[0].scrollTop = messages[0].scrollHeight;
    }

    postNewData(data) {
        this.state.room.log.push(data);
        this.autoScroll();
        this.setState(this.state);
    }

    broadcast(msg) {
        let that = this;
        let data = {
            type: 'message',
            sender: this.state.room.users[this.props.peer.id],
            msg: msg,
            timestamp: (new Date().getTime()).toString()
        };

        let obj = Object.assign({}, data);
        delete obj.sender.rooms;
        delete obj.sender.__v;

        let toServer = {
            room_id: that.state.room._id,
            obj: obj
        };

        $.ajax({
            type: 'post',
            url: '/log',
            contentType: 'application/json',
            data: JSON.stringify(toServer),
            success() {
                that.postNewData(data);
                $.each(Object.keys(cons), function (i, v) {
                    cons[v].send(data);
                });
            }
        });
    }

    sendMessage(e) {
        e.preventDefault();

        let user_input = $('#user-input');

        let room = this.state.room;
        let that = this;

        let msg = user_input.val();
        if (msg.indexOf('@') === 0) {
            let splitter = msg.split(' ');
            if (splitter.length >= 2) {
                if (splitter[0].length === 1) {
                    that.postNewData({
                        msg: 'You must supply a username to whisper to.',
                        type: 'error',
                        timestamp: (new Date()).toUTCString()
                    });
                } else {
                    let unam = splitter[0].substr(msg.indexOf('@') + 1);
                    if (unam === room.users[that.props.peer.id].username) {
                        that.postNewData({
                            msg: 'You can\'t whisper to yourself',
                            type: 'error',
                            timestamp: (new Date()).toUTCString()
                        });
                    } else {
                        let target = null;
                        $.each(Object.keys(room.users), function (i, v) {
                            let v_name = room.users[v].username;
                            if (target === null && v_name === unam) {
                                target = room.users[v];
                            }
                        });
                        if (target === null) {
                            that.postNewData({msg: 'User not found.', timestamp: (new Date()).toUTCString()});
                        } else {
                            let msg_content = msg.substr(msg.indexOf(splitter[1]));
                            let whisper = {
                                type: 'whisper',
                                msg: msg_content,
                                target: that.state.room.users[target._id],
                                sender: that.state.room.users[that.props.peer.id],
                                timestamp: (new Date()).toUTCString()
                            };
                            that.postNewData(whisper);
                            cons[target._id].send(whisper);
                        }
                    }
                }
            } else {
                that.postNewData({msg: 'You must supply a message', type: 'error'});
            }
        }
        else {
            this.broadcast(msg);
        }

        user_input.val('');
    }

    render() {
        return (
            <div id="chat-container">
                <div id="chat">
                    <ul id="messages">
                        {(this.state.room.log).map((msg) => {
                            switch (msg.type) {
                                case 'message':
                                    return <Message id={CryptoJS.SHA256(JSON.stringify(msg)).toString()} key={CryptoJS.SHA256(JSON.stringify(msg)).toString()} room={this.state.room} sender={msg.sender} message={msg.msg}/>;
                                    break;
                                case 'whisper':
                                    return <Whisper key={CryptoJS.SHA256(JSON.stringify(msg)).toString()} room={this.state.room} sender={msg.sender} target={msg.target} message={msg.msg}/>;
                                    break;
                                case 'notif':
                                    return <Notification key={CryptoJS.SHA256(JSON.stringify(msg)).toString()} message={msg.msg}/>;
                                    break;
                                case 'error':
                                    return <ErrorMsg key={CryptoJS.SHA256(JSON.stringify(msg)).toString()} message={msg.msg}/>;
                                    break;
                            }
                        })}
                    </ul>
                    <form id="message-box" onSubmit={this.sendMessage.bind(this)}>
                        <input id="user-input" type="text" required={true} autoComplete="off" placeholder="Enter Message here, or @USERNAME to whisper someone"/>
                        <input type="file" className="hidden" accept="image/*|audio/*|video/*"/>
                        <button id="send-message">Send</button>
                    </form>
                </div>
                <div id="user-rack">
                    <button id="call" className={(this.state.room.inCall) ? "muted" : ""} onClick={this.joinCall.bind(this)}>{(this.state.room.inCall) ? "Leave Call" : "Join Call"}</button>
                    <h3>Users</h3>
                    <ul id="current-users">
                        {Object.values(this.state.room.users).map((user) => {
                            return (
                                <li key={user._id} id={"user-" + user._id} className="user">
                                    {user.username}
                                    {this.state.room.inCall ? peer.id === user._id ? <MuteButton /> : '' : ''}
                                </li>
                            );
                        })}
                    </ul>
                    <ul className="streams">
                        {(this.state.room.streams).map((str) => {
                            return (
                                <audio key={CryptoJS.SHA256(JSON.stringify(str)).toString()} id={"stream-" + str._id} src={str.stream} autoPlay={true}>Stream</audio>
                            );
                        })}
                    </ul>
                </div>
            </div>
        );
    }
}

class MuteButton extends React.Component {
    state = {
        muted: false
    };

    MuteLocal() {
        let that = this;
        window.localStream.getAudioTracks()[0].enabled = !window.localStream.getAudioTracks()[0].enabled;
        that.state.muted = !window.localStream.getAudioTracks()[0].enabled;
        that.setState(that.state);
    }

    render() {
        return (
            <button id="muteButton" onClick={ this.MuteLocal.bind(this) } className={ (this.state.muted ? 'btn-info' : '') + ' btn' }>
                <i className="fa fa-microphone-slash"> </i>
            </button>
        );
    }
}

class App extends React.Component {
    state = {
        mode: MODE.LOGIN,
        user: null,
        peer: null
    };

    componentDidMount() {
        let cookie_data = getCookie('user');
        if (cookie_data) {
            let user = JSON.parse(cookie_data);
            console.log(user);
            peer = new Peer(user._id, server_connection);
            this.setState({
                mode: MODE.PSYKE,
                user: user,
                peer: peer
            });
        }
    }

    newUser() {
        this.setState({
            mode: MODE.REGISTER,
            user: null
        });
    }

    logout() {
        delete_cookie('user');
        let that = this;

        $.ajax({
            type: 'post',
            url: '/disconnect',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: this.state.user._id
            }),
            success() {
                that.setState({
                    mode: MODE.LOGIN,
                    user: null,
                    peer: that.state.peer
                });
            }
        });

        $.each(Object.keys(cons), function (i, v) {
            cons[v].close();
            delete cons[v];
        });

        peer.destroy();

        if(recon !== undefined){
            clearInterval(recon);
            recon = undefined;
        }
    }

    login(mode, user) {
        peer = new Peer(user._id, server_connection);
        this.setState({
            mode: mode,
            user: user,
            peer: peer
        });
    }

    register(mode, user) {
        peer = new Peer(user._id, server_connection);
        this.setState({
            mode: mode,
            user: user,
            peer: peer
        });
    }

    swapMode(mode) {
        this.state.mode = mode;
        if(recon){
            clearInterval(recon);
            recon = undefined;
        }
        this.setState(this.state);
    }

    rendererMode() {
        switch (this.state.mode) {
            case MODE.LOGIN:
                return <Login newUser={this.newUser.bind(this)} login={this.login.bind(this)} swapMode={this.swapMode.bind(this)}/>;
            case MODE.PSYKE:
                return <Psyke key={this.state.user._id} logout={this.logout.bind(this)} user={this.state.user} peer={this.state.peer} swapMode={this.swapMode.bind(this)} />;
            case MODE.PSYKE_DEBUG:
                return <Example />;
            case MODE.REGISTER:
                return <Register register={this.register.bind(this)} swapMode={this.swapMode.bind(this)}/>;
            default:
                return <Example />;
        }
    }

    render() {
        return (
            (this.rendererMode())
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));