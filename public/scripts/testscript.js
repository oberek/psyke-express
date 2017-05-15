/**
 * Created by tfeue on 5/15/2017.
 */
/**
 * Created by tfeue on 5/12/2017.
 */

/*quick and dirty ID generation... by no means is this safe however*/
function makeid() {
    var text = '';
    /*preventing line length from going above 80*/
    var lowercase = 'abcdefghijklmnopqrstuvwxyz';
    var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var numbers = '0123456789';
    var possible = uppercase + lowercase + numbers;

    for (var i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

var connections = {};
var peerID = $('#peer-id');

$('#peer-connect').on('click', function (evt) {
    evt.preventDefault();

    console.log(peerID.val());

    connections[peerID.val()] = peer.connect(peerID.val());
});

var id = makeid();

var peer = new Peer(id, {
    // host: 'localhost',
    host: 'psyke-express.herokuapp.com',
    port: 8080,
    path: '/peer'
});

peer.on('open', function (id) {
    var output = 'My peer ID is: ' + id;
    document.getElementById('container').innerHTML = output;
    console.log(output);
});

peer.on('connection', function (conn) {

    console.log(conn.peer + 'has connected to you');

    //this might create in infinite loop
    //var responseConnection = peer.connect(conn.peer);

    conn.on('error', function (err) {
        //console.log(err);
        alert(err);
    });

    conn.on('data', function (data) {
        console.log(data);
    });

    //not supported by Firefox (Mozilla needs to git gud)
    conn.on('close', function () {
        console.log('Peer has left the connection');
    });
});

peer.on('call', function (call) {
    console.log('someone\'s calling');
});

/*
 //using the => operator is more efficient, but WebStorm likes to squawk
 peer.on('connection', conn => {
 conn.on('data', data => {
 console.log(data);
 });
 });
 */
