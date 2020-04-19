/*
* Login Function
* */
// function login() {
//     var xhr = new XMLHttpRequest();
//     xhr.open("POST", "https://localhost:16001/login", true);
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     xhr.withCredentials = true;
//
//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === 4) {
//             alert(xhr.response);
//             let result = JSON.parse(xhr.response);
//             if(result.success === true){
//                 document.getElementById("loggedOut").style.display = "none";
//                 document.getElementById("loggedIn").style.display = "block";
//             }
//         }
//     };
//     xhr.send(JSON.stringify({
//         username: document.getElementById("loginemail").value,
//         password: document.getElementById("loginpassword").value
//     }));
// }

/*
* Logout Function
* */
function logout() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://localhost:16001/logout", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            alert(xhr.response);
            let result = JSON.parse(xhr.response);
            if(result.success === true){
                document.getElementById("loggedOut").style.display = "block";
                document.getElementById("loggedIn").style.display = "none";
            }
        }
    };
    xhr.send();
}

/*
* Register Function
* */
function register() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://localhost:16001/register", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            alert(xhr.response);
            let result = JSON.parse(xhr.response);
            if(result.success === true){
                document.getElementById("loggedOut").style.display = "none";
                document.getElementById("loggedIn").style.display = "block";
            }
        }
    };
    let message = JSON.stringify({
        password: document.getElementById("registerpassword").value,
        email: document.getElementById("registeremail").value,
        username: document.getElementById("registername").value
    });
    xhr.send(message);
}

/*
* Function to parse html5 cookie data.
* */
function getCookie(name) {
    let dc = document.cookie;
    let prefix = name + "=";
    let end;
    let begin = dc.indexOf("; " + prefix);
    if (begin === -1) {
        begin = dc.indexOf(prefix);
        if (begin !== 0) return null;
    }
    else
    {
        begin += 2;
        end = document.cookie.indexOf(";", begin);
        if (end === -1) {
            end = dc.length;
        }
    }
    // because unescape has been deprecated, replaced with decodeURI
    //return unescape(dc.substring(begin + prefix.length, end));
    return decodeURI(dc.substring(begin + prefix.length, end));
}

// window.onload = function () {
//     if(getCookie("user")){
//         document.getElementById("loggedOut").style.display = "none";
//         document.getElementById("loggedIn").style.display = "block";
//     }
// };
