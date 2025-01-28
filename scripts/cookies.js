// cookies


/**
 * Gives a datetime formatted as a string representing the coming midnight.
 * This is used as the expiry for cookies.
 * 
 * @returns {string} coming midnight datetime as string
 */
function getMidnightComing() {
    let midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0); 
    midnight.setMinutes(0); 
    midnight.setSeconds(0); 
    midnight.setMilliseconds(0);
    return midnight.toUTCString();
}


/**
 * Adds a cookie to the document, which has an expiry at midnight.
 * Used for keeping user progress.
 * 
 * @param {string} cookieName - the name of the cookie
 * @param {string} cookieValue - the value associated to the cookie
 */
function setCookie(cookieName, cookieValue) {
    document.cookie = cookieName + "=" + cookieValue + ";expires=" + getMidnightComing() + ";path=/";
}

/**
 * Takes a cookie name and returns the cookie value. If the cookie can't be found,
 * an empty string is returned.
 * 
 * @param {string} cookieName - the name of the cookie
 * @returns {string} the value of the cookie
 */
function getCookie(cookieName) {
    let leadingName = cookieName + "=";
    let cookieList = document.cookie.split(';');
    // iterate through the cookies
    for (let i = 0; i < cookieList.length; i++) {
        let cookie = cookieList[i];
        // clean the cookie of any training spaces
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        // check this is the requested cookie
        if (cookie.indexOf(leadingName) == 0) {
            return cookie.substring(leadingName.length, cookie.length);
        }
    }
    return "";
}

/**
 * Checks whether there are any cookies present
 */
function cookiesPresent() {
    return (document.cookie.length != 0)
}
