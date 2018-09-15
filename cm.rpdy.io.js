function addCSSFile(url){
	var stylesheet = document.createElement("link");
	stylesheet.rel = "stylesheet";
	stylesheet.href = url;
	document.head.appendChild(stylesheet);
}
function addJSScript(url){
	var script = document.createElement("script");
	script.type = "application/javascript";
	script.src = url;
	document.head.appendChild(script);
}

function addJQueryUi(){
    addCSSFile("https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css");
    addJSScript("https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js");
}

function addEFormScript(){
    addJSScript("https://rawgit.com/seraphimalia/cm-eform-scripts/master/start-eform.js");
}

function ensureCallBeginFunction(){
    if (typeof addEFormButton === 'function') {
        addEFormButton();
    } else {
        setTimeout(ensureCallBeginFunction, 1000);
    }
}

if (document.location.href.startsWith('https://cm.rpdy.io/Orders/') && document.location.href.replace('https://cm.rpdy.io/Orders/', '') > 0) {
    console.log("CDInjector: Incident Page Detected");
    document.addEventListener("DOMContentLoaded", function(event) { 
        addJQueryUi();
        addEFormScript();
        ensureCallBeginFunction();
    });
} else {
    console.log("CDInjector: No Incident page was detected.");
}