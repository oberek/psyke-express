/*global $*/
/*global React*/
/*global ReactDOM*/

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
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

let MultiChat = React.createClass({});

$(document).ready(function () {
    let multichat = document.getElementById('multichat');

    let user = JSON.parse(getCookie('user'));
    console.log(user);

    ReactDOM.render(<MultiChat user={user} />, multichat);
});