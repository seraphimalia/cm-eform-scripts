function getCallSourceData () {
  var exists, source, sourceOther

  const sourceElementLength = $("#DynamicListsContainer")
    .find(`div[data-groupid='319']`)
    .find(`label:contains('Call Source')`).length

  if (sourceElementLength > 0) {
    exists = true
    let indexSource = 0;
    for (let i = 0; i < sourceElementLength; i++) {
      const labelText = $("#DynamicListsContainer")
        .find(`div[data-groupid='319']`)
        .find(`label:contains('Call Source')`)[i].innerText;
      if (labelText.toLowerCase() === "call source") {
        indexSource = i;
        break;
      }
    }

    let indexSourceOther = 1;
    for (let i = 0; i < sourceElementLength; i++) {
      const labelText = $("#DynamicListsContainer")
        .find(`div[data-groupid='319']`)
        .find(`label:contains('Call Source')`)[i].innerText;
      if (labelText.toLowerCase() === "call source other") {
        indexSourceOther = i;
        break;
      }
    }

    source = $("#DynamicListsContainer")
      .find(`div[data-groupid='319']`)
      .find(`label:contains('Call Source')`)[indexSource]
      .nextSibling
      .nextSibling.innerText

    sourceOther = $("#DynamicListsContainer")
      .find(`div[data-groupid='319']`)
      .find(`label:contains('Call Source')`)[
      indexSourceOther
    ].nextSibling.value;
  } else {
    exists = false
  }

  return { exists, source, sourceOther }
}

function validateCallSource () {
  var { exists, source } = getCallSourceData()

  if (exists && source === 'Select an option') {
    return false
  }
  return true
}

function validateCallSourceOther () {
  var { exists, source, sourceOther } = getCallSourceData()
  var sourceLower = source.toLowerCase()

  if (exists &&
    sourceLower !== "emergency line" &&
    sourceLower !== "external agency (doh)" &&
    sourceLower !== "external agency (er24)" && (!sourceOther || sourceOther.length === 0)) {
    return false
  }
  return true
}

function displayErrors (errors) {
  $("body").append(`
    <div id="CustomErrorModal" class="swal2-container swal2-center swal2-fade swal2-shown" style="overflow-y: auto;">
      <div aria-labelledby="swal2-title" aria-describedby="swal2-content" class="swal2-popup swal2-modal swal2-show" tabindex="-1" role="dialog" aria-live="assertive" aria-modal="true" style="display: flex;">
        <div class="swal2-header">
          <ul class="swal2-progresssteps" style="display: none;"></ul>
          <div class="swal2-icon swal2-error swal2-animate-error-icon" style="display: flex;">
            <span class="swal2-x-mark">
              <span class="swal2-x-mark-line-left"></span>
              <span class="swal2-x-mark-line-right"></span>
            </span>
          </div>
          <div class="swal2-icon swal2-question" style="display: none;">
            <span class="swal2-icon-text">?</span>
          </div>
          <div class="swal2-icon swal2-warning" style="display: none;">
            <span class="swal2-icon-text">!</span>
          </div>
          <div class="swal2-icon swal2-info" style="display: none;">
            <span class="swal2-icon-text">i</span>
          </div>
          <div class="swal2-icon swal2-success" style="display: none;">
            <div class="swal2-success-circular-line-left" style="background-color: rgb(255, 255, 255);"></div>
            <span class="swal2-success-line-tip"></span>
            <span class="swal2-success-line-long"></span>
            <div class="swal2-success-ring"></div>
            <div class="swal2-success-fix" style="background-color: rgb(255, 255, 255);"></div>
            <div class="swal2-success-circular-line-right" style="background-color: rgb(255, 255, 255);"></div>
          </div>
          <img class="swal2-image" style="display: none;">
          <h2 class="swal2-title" id="swal2-title">Please correct the following issues:</h2>
          <button type="button" class="swal2-close" style="display: none;">×</button>
        </div>
        <div class="swal2-content">
          <div id="swal2-content" style="display: block;">
            ${errors.join('<br />')}<br>
          </div>
          <input class="swal2-input" style="display: none;">
          <input type="file" class="swal2-file" style="display: none;">
          <div class="swal2-range" style="display: none;">
            <input type="range"><output></output>
          </div>
          <select class="swal2-select" style="display: none;"></select>
          <div class="swal2-radio" style="display: none;"></div>
          <label for="swal2-checkbox" class="swal2-checkbox" style="display: none;">
            <input type="checkbox">
          </label>
          <textarea class="swal2-textarea" style="display: none;"></textarea>
          <div class="swal2-validationerror" id="swal2-validationerror" style="display: none;"></div>
        </div>
        <div class="swal2-actions" style="display: flex;">
          <button id="CustomErrorModalClose" type="button" class="swal2-confirm swal2-styled" aria-label="" style="border-left-color: rgb(48, 133, 214); border-right-color: rgb(48, 133, 214);">OK</button>
          <button type="button" class="swal2-cancel swal2-styled" aria-label="" style="display: none;">Cancel</button>
        </div>
        <div class="swal2-footer" style="display: none;">
      </div>
    </div>
  </div>`)

  $("#CustomErrorModalClose").on('click', () => {
    $("#CustomErrorModal").remove()
  })
}

function validateForm () {
  try {
    var errors = []
    if (!validateCallSource()) {
      errors.push('Call Source Missing')
    }
    if (!validateCallSourceOther()) {
      errors.push('Call Source Other Missing')
    }

    if (errors.length > 0) {
      displayErrors(errors)
    } else {
      $("#CreateIncident").triggerHandler('click')
    }

    return false
  } catch (error) {
    alert('Please let Clive know about this error: ' + error.message)
    $("#CreateIncident").triggerHandler('click')
  }
}

jQuery.fn.outerHTML = function () {
  return jQuery('<div />').append(this.eq(0).clone()).html();
};

function replaceCreateButton () {
  var buttonHtml = $("#CreateIncident").outerHTML()

  $("#CreateIncident").hide()

  $("#CreateIncident").parent().append(buttonHtml.replace(/CreateIncident/g, 'CreateIncidentCustom'))

  $("#CreateIncidentCustom").on('click', validateForm)
}

replaceCreateButton()
