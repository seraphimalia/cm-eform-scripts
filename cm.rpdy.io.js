function addCSSFile (url) {
    var stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = url;
    document.head.appendChild(stylesheet);
}
function addJSScript (url) {
    var script = document.createElement("script");
    script.type = "application/javascript";
    script.src = url;
    document.head.appendChild(script);
}

function addJQueryUi () {
    addCSSFile("https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css");
    addJSScript("https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js");
}

function addEFormScript () {
    addJSScript("https://cdn.jsdelivr.net/gh/seraphimalia/cm-eform-scripts@master/start-eform.js");
    _cdlog("CDInjector: Eform Script Added.");
}

function _cdlog (text) {
    if (document.location.href.indexOf('cdinjector-debug=true') !== -1) {
        console.log(text);
    }
}

function extractOrderNumberFromUrl (url) {
    let ORDER_NUMBER_REGEX = /https:\/\/cm.rpdy.io\/Orders\/(\d+)(($)|(\?)|(\#))/;
    let matches = ORDER_NUMBER_REGEX.exec(url);
    if (matches.length > 1 && !isNaN(matches[1])) {
        return matches[1];
    }
    return undefined;
}

if (document.location.href.startsWith('https://cm.rpdy.io/Orders/') && extractOrderNumberFromUrl(document.location.href) > 0) {
    _cdlog("CDInjector: Incident Page Detected");
    if (document.readyState === "complete"
        || document.readyState === "loaded"
        || document.readyState === "interactive") {
        addEFormScript();
    } else {
        document.addEventListener("DOMContentLoaded", function (event) {
            //addJQueryUi();
            addEFormScript();
        });
    }
} else {
    _cdlog("CDInjector: No Incident page was detected: " + document.location.href);
}
