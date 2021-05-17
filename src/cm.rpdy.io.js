// function addCSSFile (url) {
//   const stylesheet = document.createElement('link')
//   stylesheet.rel = 'stylesheet'
//   stylesheet.href = url
//   document.head.appendChild(stylesheet)
// }

function addJSScript (url) {
  const script = document.createElement('script')
  script.type = 'application/javascript'
  script.src = url
  document.head.appendChild(script)
}

// function addJQueryUi () {
//   addCSSFile('https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css')
//   addJSScript('https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js')
// }

function addEFormScript () {
  // addJSScript("https://cdn.jsdelivr.net/gh/seraphimalia/cm-eform-scripts@master/start-eform.min.js");
  // addJSScript("https://rawgit.com/seraphimalia/cm-eform-scripts/master/start-eform.js");
  addJSScript('https://deploy-preview-1--cm-eform-scripts.netlify.app/e-form/index.js')
  _cdlog('CDInjector: Eform Script Added.')
}

function addCreateIncidentRulesScript () {
  addJSScript('https://cdn.jsdelivr.net/gh/seraphimalia/cm-eform-scripts@master/create-incident-rules.js')
  // addJSScript("https://rawgit.com/seraphimalia/cm-eform-scripts/master/create-incident-rules.js");
  // addJSScript("http://localhost:8000/create-incident-rules.js");
  _cdlog('CDInjector: Create Incident Rules Script Added.')
}

function _cdlog (text) {
  if (document.location.href.indexOf('cdinjector-debug=true') !== -1) {
    console.log(text)
  }
}

function extractOrderNumberFromUrl (url) {
  const ORDER_NUMBER_REGEX = /https:\/\/cm.rpdy.io\/Orders\/(\d+)(($)|(\?)|(#))/
  const matches = ORDER_NUMBER_REGEX.exec(url)
  if (matches && matches.length > 1 && !isNaN(matches[1])) {
    return matches[1]
  }
  return undefined
}

if (document.location.href.startsWith('https://cm.rpdy.io/Orders/') && extractOrderNumberFromUrl(document.location.href) > 0) {
  _cdlog('CDInjector: Incident Page Detected')
  if (document.readyState === 'complete' ||
        document.readyState === 'loaded' ||
        document.readyState === 'interactive') {
    addEFormScript()
  } else {
    document.addEventListener('DOMContentLoaded', function (event) {
      // addJQueryUi();
      addEFormScript()
    })
  }
} else {
  _cdlog('CDInjector: No Incident page was detected: ' + document.location.href)
}

if (document.location.href.startsWith('https://cm.rpdy.io/Orders/New/')) {
  _cdlog('CDInjector: Create Incident Page Detected')
  if (document.readyState === 'complete' ||
        document.readyState === 'loaded' ||
        document.readyState === 'interactive') {
    addCreateIncidentRulesScript()
  } else {
    document.addEventListener('DOMContentLoaded', function (event) {
      // addJQueryUi();
      addCreateIncidentRulesScript()
    })
  }
} else {
  _cdlog('CDInjector: No Create Incident page was detected: ' + document.location.href)
}
