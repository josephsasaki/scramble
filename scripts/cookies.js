// cookies

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    // Set the time to midnight
    d.setHours(0); 
    d.setMinutes(0); 
    d.setSeconds(0); 
    d.setMilliseconds(0);
    // Get the timestamp of midnight
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
  
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function gridToString() {
    var tileArray = [];
    var tiles = Array.prototype.slice.call( document.getElementsByClassName("tile") );
    var slot;
    tiles.forEach(tile => {
        if (tile.parentElement.className=="slot") {
            slot = tile.parentElement;
            tileArray.push(tile.id + ":" + slot.id);
        } else {
            tileArray.push(tile.id + ":#");
        }
    });
    return tileArray.join("-");
}

function stringToGrid(string) {
    var letterBox = document.getElementById("box");
    var strArray = string.split("-");
    var tile, slot, x, round;
    strArray.forEach(str => {
        x = str.split(":");
        tile = document.getElementById(x[0]);
        if (x[1]!="#") {
            round = parseInt(tile.getAttribute("round"));
            tile.setAttribute('draggable', "false");
            tile.style.backgroundColor = LOCKED_COLOURS[round][0];
            tile.style.boxShadow = "0px -4px inset " + LOCKED_COLOURS[round][1];
            slot = document.getElementById(x[1]);
            slot.appendChild(tile);
        } else {
            letterBox.appendChild(tile);
        }
    });
}