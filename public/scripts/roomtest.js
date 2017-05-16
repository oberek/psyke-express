/**
 * Created by tfeue on 5/16/2017.
 */
"use-strict";

function makeID() {
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

$(document).ready(function () {
    var my_id = makeID();
    $('#peer-id').text("My id: "+ my_id);

    $.ajax({
        url: window.location.protocol + "/getRooms",
        success: function (data) {
            console.log(data);
            var rooms = JSON.parse(data);
            console.log(rooms);

            $.each(Object.keys(rooms), function (i, v) {
               var li = $('<li>');

               var room = rooms[v];
               var room_name = $('<h3>').text(room.name);
               var conn_button =$('<form method="post" action="/join_room/'+room.id+'/'+my_id+'">').append(
                   $('<input type="submit" class="conn-button" id="'+room.id+'" >').text('Join'));
               room_name.append("&ensp;").append(conn_button);
               li.append(room_name);
               $('#rooms').append(li);
            });
        }
    });
});