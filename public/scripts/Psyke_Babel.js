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


// let inCall=false;
let URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
const server_connection = {
    host: window.location.hostname,
    // port: window.location.port || '8080',
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
    console.log(evt.target);
    let tar = evt.target;
    tar.value = tar.value.replace(/\W+/g, "");
}

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
            success(data) {
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

class Login extends React.Component {
    //    constructor(props) {
    //        super(props);
    //        let that=this;
    //        this.state={that: that};
    //    }


    attemptLogin(e) {
        // let component=this;
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
                    password:z_password
                }),
                success(data) {
                    console.log('Success');
                    console.log(data);
                    let d = JSON.parse(data);
                    setCookie('user', JSON.stringify(d), 15 * 60);
                    that.props.login(MODE.PSYKE, d);
                },
                error(err) {
                    error_container.text("Status: " + err.status + " \nStatus Code: " + err.statusCode);
                    console.log('err');
                    console.log(err);
                    // db.users += JSON.stringify({
                    //     username: z_username,
                    //     password: z_password
                    // });
                    // that.props.register(MODE.REGISTER, null);
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
                <span id="login-error" className="hidden"> errors go here </span>
                <form id="login-form" data-toggle="validator" onSubmit={this.attemptLogin.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="username"> Username: </label>
                        <input id="login_username" className="form-control" name="username" type="text"
                               placeholder="Username" required/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password"> Password: </label> <input id="login_password"
                                                                             className="form-control" name="password"
                                                                             type="password" placeholder="Password"
                                                                             required/>
                    </div>
                    <input className="btn btn-success" type="submit" value="Submit"
                           onClick={ this.attemptLogin.bind(this) }/>
                </form>
                {/*<p> Don 't have an account? <a onClick={this.registerOnClickHandler()} >Register</a> for a new one</p> */}
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
        // let component=this;
        // console.log(component);
        e.preventDefault();

        console.log('Attempting register...');
        // console.log(this);
        let that = this;
        let error_container = $('#register-error');
        let z_username = $('#register_username').val().toString();
        let z_password = $('#register_password').val().toString();
        console.log(z_username + "::" + z_password);
        if (z_username === "" || z_password === "") {
            error_container.toggleClass('hidden', false);
            error_container.text('You need to provide a username and password');
        } else {
            $.ajax({
                type: 'POST',
                url: '/register',
                contentType: 'application/json',
                data: JSON.stringify({
                    username: z_username,
                    password: z_password
                }),
                success(data) {
                    console.log('Success');
                    console.log(data);
                    let d = JSON.parse(data);
                    console.log(d);
                    setCookie('user', JSON.stringify(d), 15 * 60);
                    that.props.register(MODE.PSYKE, d);
                },
                error(err) {
                    console.log('err');
                    console.log(err);
                    // db.users += JSON.stringify({
                    //     username: z_username,
                    //     password: z_password
                    // });
                }
            });

            // fetch('/register/' + z_username + '/' + z_password)
            //     .then(res => res.json())
            //     .then((d) => {
            //         console.log(d);
            //         if (d.result) {
            //             //do something
            //             setCookie('user', JSON.stringify(d.result), 15 * 60);
            //             this.props.register(MODE.PSYKE, d.result);
            //         } else {
            //             error_container.text('Username or Password are incorrect');
            //             error_container.toggleClass('hidden', false);
            //         }
            //     });
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
                <span id="register-error" className="hidden"> errors go here </span>
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
                        {/*<button type="submit" className="btn btn-primary">Submit</button>*/}
                        <input className="btn btn-success" type="submit" value="Submit"/>
                    </div>
                </form>

                <button className="btn btn-primary" onClick={this.loginOnClickHandler()}> Login</button>
            </div>
        );
    };
}

class Example extends React.Component {
    state = {
        users: [],
        rooms: {}
    };

    componentDidMount() {
        fetch('/users')
            .then(res => res.json())
            .then(users => {
                fetch('/rooms')
                    .then(res => res.json())
                    .then(rooms => this.setState({
                        users, rooms
                    }));
            });
    }

    render() {
        return ( <div className="App">
                <h1> Users </h1> {
                this.state.users.map(user =>
                    <div key={
                        user._id
                    }> Username: {
                        user.username
                    } <br />
                        Rooms:
                        <ul className="rooms"> {
                            user.rooms.map(_id => {
                                return ( <li key={
                                    _id
                                }> {
                                    this.state.rooms[_id].room_name
                                } </li>);
                            })
                        } </ul>
                    </div>
                )
            } </div>
        );
    }
}

class Psyke extends React.Component {
    state = {
        current_room: null,
        rooms: []
    };

    addNewRoom(room){
        this.state.rooms.push(room);
        this.setState(this.state);
    }

    componentDidMount() {
        let user = this.props.user;
        let that = this;
        console.log(JSON.stringify(user));
        console.log(user);
        console.log(user.rooms);
        // that.setState({
        //     current_room: user.rooms[0]._id,
        //     rooms: user.rooms
        // });

        that.state.current_room = user.rooms[0]._id;
        that.state.rooms = user.rooms;
        console.log(that.state.rooms);

        that.setState(that.state);

        // $.ajax({
        //     type: 'POST',
        //     url: '/getUserRooms',
        //     contentType: 'application/json',
        //     data: JSON.stringify({
        //         user_id: user._id
        //     }),
        //     success(data) {
        //         console.log('Success');
        //         console.log(data);
        //         let r=JSON.parse(data);
        //
        //         let rms=[];
        //         $.each(r, (i, v) => {
        //             rms.push(v);
        //         });
        //         that.setState({
        //             current_room: rms[0]._id,
        //             rooms: rms
        //         });
        //
        //         // let d=JSON.parse(data);
        //         // setCookie('user', JSON.stringify(d.result), 15 * 60);
        //         // that.props.login(MODE.PSYKE, d.result);
        //     },
        //     error(err) {
        //         console.log('err');
        //         console.log(err);
        //     }
        // });
    }

    updateCurrentRoom(_id) {
        this.setState({
            current_room: _id,
            rooms: this.state.rooms
        });
        console.log('should update chat container props');
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
                                   current_room={this.state.current_room}/>
                </div>
            </div>
        );
    }
}

class RoomRack extends React.Component {
    state = {
        current_room: null,
        rooms: []
    };

    updateCurrentRoom(_id) {
        console.log(_id);
        this.setState({
            current_room: _id,
            rooms: this.state.rooms
        });
        this.props.updateCurrentRoom(_id);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            current_room: nextProps.current_room,
            rooms: nextProps.rooms
        });
    }


    componentDidMount() {
        $('#new-room-form').validator();
    }

    newRoom(e){
        let that = this;
        console.log(that.state);
        console.log(that.props);
        console.log(that.props.user_id);
        let newRoomInput = $('#new-room-input');
        e.preventDefault();
        let room_name = newRoomInput.val();
        if(room_name.length > 3){
            // console.log(room_name);
            $.ajax({
                url: '/newRoom',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    room_name: room_name,
                    user_id: that.props.user_id
                }),
                success(data){
                    console.log('Successfully created a new room!');
                    console.log(data);

                    let room = JSON.parse(data);

                    that.props.addNewRoom(room);
                },
                error(err){
                    console.log(err);
                }
            });

            newRoomInput.val('');
            $('#newRoomModal').modal('toggle');
        } else {
            console.err('do something');
        }
    }

    render() {
        return (
            <div id="room-rack">
                <h4> Room
                    Rack </h4> { /*eventually turn the list into a list of new components, but a list of names is good for now*/ }
                <ul id="room-list"> {
                    this.state.rooms.map((room) => {
                        return ( <li key={
                            room._id
                        }>
                            <button id={
                                room._id
                            }
                                    className={
                                        (this.state.current_room === room._id ? "current " : "") + "room btn"
                                    }
                                    onClick={
                                        () => this.updateCurrentRoom(room._id)
                                    }> {
                                room.room_name
                            } </button>
                        </li>);
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
                                <form id="new-room-form" role="form" data-toggle="validator" onSubmit={this.newRoom.bind(this)}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="new-room-input">Enter a name for your Room here:</label>
                                        <input id="new-room-input" className="form-control" type="text" required placeholder="Room Name"/>
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

// class UserLi extends React.Component{
//     render(){
//         if(this.props.inCall){
//             if(this.props.localUser===this.props.user._id){
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
        console.log(this.props);
        this.peerSetup(this.props.peer);
        console.log(typeof this.state.room.log);
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
                user_id: nextProps.user._id
            }),
            success(data) {
                console.log('Success');
                console.log(data);
                console.log(JSON.parse(data));
                let r = JSON.parse(data);
                console.log('connected local user to the room with id ' + nextProps.current_room);
                r.users = {};
                r.streams = [];
                console.log(nextProps.user._id);
                r.users[nextProps.user._id] = nextProps.user;
                r.log.unshift(that.state.room.log[0]);
                that.state.room = r;
                that.setState(that.state);
                console.log(r);

                $.each(r.online_members, function (i, peer_id) {
                    console.log(peer_id, peer.id);
                    if (peer_id !== nextProps.peer.id) {
                        let conn = peer.connect(peer_id);
                        console.log(conn);
                        that.addDataConnection(conn);
                    } else {
                        console.log('add self to users list');
                    }
                });

            }
        });
    }

    decodeData(data) {
        let that = this;
        console.log(data);
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
                    // that.postNewNotif({msg: data.user.username + ' has joined the chat'});
                    let room = that.state.room;
                    // room.inCall = false;
                    console.log(data.user);
                    room.users[data.user._id] = data.user;
                    that.setState({room: room});
                    console.log('user info added');
                    // that.forceUpdate();
                }
                // room.online_members[data.user_id] = data.content;
                // addUser(data.content);
                break;
            case 'message':
            // that.postNewData(data);
            // // that.postNewMessage(data);
            // that.state.room.log.push(data);
            // break;
            case 'whisper':
                that.postNewData(data);
                // // that.postNewWhisper(data);
                // that.state.room.log.push(data);
                // that.forceUpdate();
                break;
            case 'disconnect':
                that.postNewData({
                    msg: that.state.room.users[data.user_id].username + ' has left the chat.',
                    type: 'notif',
                    timestamp: (new Date()).toUTCString()
                });
                // that.postNewNotif({msg: room.online_members[data.user_id].name + ' has left the chat.'});
                // dropUser(data.user_id);
                break;
            case 'call-request':
                that.postNewData({
                    msg: that.state.room.users[data.user_id].username + ' has joined the call.',
                    type: 'notif',
                    timestamp: (new Date()).toUTCString()
                });
                // that.postNewNotif({msg: room.online_members[data.user_id].name + ' has joined the call.'});
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
                that.postNewData({msg: JSON.stringify(data), type: 'err', timestamp: (new Date()).toUTCString()});
                break;
        }
    }

    addCallStream(call) {
        let that = this;
        call.answer(window.localStream);
        if (calls[call.peer] === undefined) {
            calls[call.peer] = call;
            // let user_li = $('#user-' + call.peer);
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
                console.log('something');
                // if(that.state.room.inCall){
                // that.postNewData({msg: that.state.room.users[call.peer].username + ' has left the call', type: 'notif', timestamp: (new Date()).toUTCString()});
                // }
                // that.postNewNotif({msg: room.online_members[call.peer].username + ' has left the call'});
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
            console.log(that.state.room);
            console.log(that.state.room.users);
            console.log(that.state.room.users[conn.peer]);
            that.postNewData({
                msg: that.state.room.users[conn.peer].username + ' has left the chat',
                type: 'notif',
                timestamp: (new Date()).toUTCString()
            });
            // that.postNewNotif({msg: that.state.room.users[this.peer].username + ' has left the chat'});
            // dropUser(this.peer);
            console.log(conn.peer, 'has disconnected');
            let new_state = Object.assign({}, that.state);
            delete new_state.room.users[conn.peer];
            that.setState(new_state);
        });

        conn.on('error', function (err) {
            that.postNewData({msg: err, type: 'err', timestamp: (new Date()).toUTCString()});
            // that.postNewError({msg: err});
            console.log(err);
        });
    }

    addDataConnection(conn) {
        let that = this;
        console.log(conn);
        cons[conn.peer] = conn;
        if (conn.open) {
            that.addConnEventListeners(conn);
            conn.send({type: 'info-request', user_id: peer.id});
        } else {
            console.log('waiting for conn to open');
            conn.on('open', function () {
                console.log('conn has opened');
                that.addConnEventListeners(conn);
                conn.send({type: 'info-request', user_id: peer.id});
            });
        }
    }

    peerSetup(p) {
        let that = this;
        if (p instanceof Peer) {
            p.on('connection', function (conn) {
                console.log(conn);
                console.log('Peer with id (' + conn.peer + ') has connected to you');
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
            console.log('step2');
            if (useVoice) {
                $.each(Object.values(cons), function (i, conn) {
                    console.log(conn);
                    if (that.state.room.inCall) {
                        //disconnect from the call
                        cons[conn.peer].send({type: 'hangup', user: that.state.room.users[that.props.peer.id]})
                        delete calls[conn.peer];
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

        console.log(navigator);

        if (window.localStream === undefined) {
            navigator.getUserMedia({audio: true, video: false}, function (stream) {
                useVoice = true;
                window.localStream = stream;
                step2();
            }, function () {
                console.log(window.localStream);
                that.postNewData(
                    {
                        type: 'error',
                        msg: 'Something went wrong with your input devices. Aborting call\nPlease check your audio devices and make sure your are using https',
                        timestamp: (new Date()).toUTCString()
                    });
                // that.postNewError(
                //     {
                //         type: 'error',
                //         msg: 'Something went wrong with your input devices. Aborting call\nPlease check your audio devices and make sure your are using https',
                //         timestamp: (new Date()).toUTCString()
                //     });
                // console.log()
                console.error('shit happened');
            });
        } else {
            console.log('window.localStream already initialized');
            step2();
        }
    }

    autoScroll() {
        let messages = $('#messages');
        messages[0].scrollTop = messages[0].scrollHeight;
    }

    postNewData(data) {
        this.state.room.log.push(data);
        this.setState(this.state);
    }

    postNewError(err) {
        // let messages = $('#messages');
        // messages.append($('<li class="message error">').text('ERROR: ' + err.msg));
        this.state.room.log.push(err);
        this.autoScroll();
    };

    postNewNotif(msg) {
        // let messages = $('#messages');
        // messages.append($('<li class="message notif">').text('!! ' + msg.msg));
        this.state.room.log += msg;
        this.autoScroll();
    };

    postNewMessage(data) {
        // let messages = $('#messages');
        // console.log(this);
        // messages.append($('<li class="message">').text(this.state.room.users[data.user_id].username + ': ' + data.content));
        this.state.room.log += data;
        this.autoScroll();
    };

    postNewWhisper(whisper) {
        // let messages = $('#messages');
        // messages.append($('<li class="message whisper">').text(((whisper.sender === this.props.peer.id) ? 'To' : 'From') + ' ' + ((whisper.sender === this.props.peer.id) ? this.state.room.users[whisper.target].username : this.state.room.users[whisper.sender].username) + ': ' + whisper.content));
        this.autoScroll();
    };

    broadcast(msg) {
        let that = this;
        // console.log(this);
        console.log(this.state);
        console.log(this.state.room);
        console.log(this.state.room.users);
        let data = {
            type: 'message',
            sender: this.state.room.users[this.props.peer.id],
            msg: msg,
            timestamp: (new Date().getTime()).toString()
        };
        // that.postNewMessage(data);
        that.postNewData(data);
        $.each(Object.keys(cons), function (i, v) {
            cons[v].send(data);
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
                    // that.postNewError({msg: 'You must supply a username to whisper to.'});
                } else {
                    let unam = splitter[0].substr(msg.indexOf('@') + 1);
                    if (unam === room.users[that.props.peer.id].username) {
                        that.postNewData({
                            msg: 'You can\'t whisper to yourself',
                            type: 'error',
                            timestamp: (new Date()).toUTCString()
                        });
                        // that.postNewError({msg: 'You can\'t whisper to yourself', type: 'error'});
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
                            // that.postNewError({msg: 'User not found.'});
                        } else {
                            let msg_content = msg.substr(msg.indexOf(splitter[1]));
                            let whisper = {
                                type: 'whisper',
                                msg: msg_content,
                                target: that.state.room.users[target._id],
                                sender: that.state.room.users[that.props.peer.id],
                                timestamp: (new Date()).toUTCString()
                            };
                            // that.postNewWhisper(whisper);
                            that.postNewData(whisper);
                            cons[target._id].send(whisper);
                        }
                    }
                }
            } else {
                that.postNewData({msg: 'You must supply a message', type: 'error'});
                // that.postNewError({msg: 'You must supply a message'});
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
                    {/*<h3>Chatlog for {this.state.room.room_name}</h3>*/}
                    <ul id="messages">
                        {console.log(this.state.room.log)}
                        {(this.state.room.log).map((msg) => {
                            switch (msg.type) {
                                case 'message':
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
                    <form id="message-box" onSubmit={this.sendMessage.bind(this)}>
                        <input id="user-input" type="text" required={true} autoComplete="off"
                               placeholder="Enter Message here, or @USERNAME to whisper someone"/>
                        <input type="file" className="hidden" accept="image/*|audio/*|video/*"/>
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
                                <audio key={str._id} id={"stream-" + str._id} src={str.stream} autoPlay={true}>
                                    Stream</audio>
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
        return ( <button onClick={
                this.MuteLocal
            }
                         className={
                             this.state.muted ? 'muted' : ''
                         }>
                <i className="fa fa-microphone-slash"> </i></button>
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
            console.log(cookie_data);
            let user = JSON.parse(cookie_data);
            // this.setState({mode: MODE.PSYKE, user: user});
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
            success(data) {
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
        console.log(user);
        peer = new Peer(user._id, server_connection);
        this.setState({
            mode: mode,
            user: user,
            peer: peer
        });
    }

    swapMode(mode) {
        this.state.mode = mode;
        this.setState(this.state);
    }

    rendererMode() {
        switch (this.state.mode) {
            case MODE.LOGIN:
                return <Login newUser={this.newUser.bind(this)} login={this.login.bind(this)}
                              swapMode={this.swapMode.bind(this)}/>;
            case MODE.PSYKE:
                return <Psyke key={this.state.user._id} logout={this.logout.bind(this)} user={this.state.user}
                              peer={this.state.peer}/>;
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