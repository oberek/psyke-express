"use-strict";

var connections = {};

$(document).ready(function () {

    //Compatibility thing.
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
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

    var peerID = $('#peer-id');

    $('#peer-connect').on('click', function (evt) {
        evt.preventDefault();

        console.log(peerID.val());
        var conn = peer.connect(peerID.val());
        console.log(conn);
        connections[peerID.val()] = conn;
    });

    var id = makeid();

    // var peer = new Peer(id, {
    //     host: 'localhost',
    //     port: 8080,
    //     path: '/peer'
    // });

    // var peer = new Peer(id, {
    //     host: 'psyke-express.herokuapp.com',
    //     port: 8080,
    //     path: '/peer'
    // });

    var peer = new Peer(id, {
        host: 'psyke-tenurian.c9users.io',
        port: 8080,
        path: '/peer'
    });

    //id and peer.id are identical... do we want to keep the function as is or remove the parameter and just use peer.id?
    //ultimately I think it will depend on how user logins are handled
    peer.on('open', function (id) {
        var output = 'My peer ID is: ' + id;
        document.getElementById('container').innerHTML = output;
        console.log(output);
        console.log("::" + peer.id);
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
            console.log("data: " + JSON.stringify(data));
        });

        //not supported by Firefox (Mozilla needs to git gud)
        conn.on('close', function () {
            console.log('Peer has left the connection');
        });
    });

    peer.on('call', function (call) {
        console.log('someone\'s calling');
    });

});


/*Code stripped from the PeerJS Video example... will prove useful later*/
// function step1 () {
//     // Get audio/video stream
//     navigator.getUserMedia({audio: true, video: false}, function(stream){
//         // Set your video displays
//         $('#my-video').prop('src', URL.createObjectURL(stream));
//
//         window.localStream = stream;
//         step2();
//     }, function(){ $('#step1-error').show(); });
// }
//
// function step2 () {
//     $('#step1, #step3').hide();
//     $('#step2').show();
// }
//
// function step3 (call) {
//     // Hang up on an existing call if present
//     if (window.existingCall) {
//         window.existingCall.close();
//     }
//
//     // Wait for stream on the call, then set peer video display
//     call.on('stream', function(stream){
//         $('#their-video').prop('src', URL.createObjectURL(stream));
//     });
//
//     // UI stuff
//     window.existingCall = call;
//     $('#their-id').text(call.peer);
//     call.on('close', step2);
//     $('#step1, #step2').hide();
//     $('#step3').show();
// }