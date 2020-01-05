/*
https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&
entry.1261286527=Emergency+Line&	 		-- $("#DynamicListsContainer").find(`div[data-groupid='319']`).find(`label:contains('Call Source')`)[0].nextSibling.innerText
entry.1014478975=Other&
entry.1772041708=West+Metro+(WC,+CPT)&
entry.1654195642=20123123/12&				-- $("#IncidentReference").html()
entry.2077619580=2018-01-01&				-- var s = $("#IncidentReference").html().substring(0, $("#IncidentReference").html().indexOf('/')); [s.slice(0, 4), s.slice(4,6), s.slice(6,8)].join('-');
entry.1655594278=Assault+-+Physical&		-- $("#PrimaryComplaintTitle")[0].innerText
entry.1375744071=1&							-- $("#PrimaryComplaintTitle")[0].innerText.charAt($("#PrimaryComplaintTitle")[0].innerText.length-1)
entry.393375178=RV01&
entry.1725583490=No+Callsigns&
entry.524386880=00:00&
entry.915011561=00:01&
entry.295402896=00:02&
entry.865471720=00:03&
entry.1363793843=00:04&
entry.1684388733=00:05&
entry.835032369=00:06&
entry.895328514=Incident+Address&
entry.237290975=-33.8590,18.5209&
entry.624304548=Abdominal+Complaint&
entry.666285626=PRF+Number&
entry.2018139507=Yes&
entry.357722881=No&
entry.1842118913=Yes&
entry.1529614769=Mistakes&
entry.2108097200=Red&
entry.847941590=Female&
entry.1646195359=99&
entry.1552249109=Asian&
entry.867510255=Non-billable&
entry.1807757148=Government+Facility&
entry.162948545=Resq-Medix
*/
function _cdlog (text) {
  if (document.location.href.indexOf("cdinjector-debug=true") !== -1) {
    console.log(text);
  }
}

function getPRFs () {
  var prfs = processPRFs(getPRFContainer(), false);

  var rhts = processPRFs(getRHTContainer(), true);

  if (prfs.length === 0 && rhts.length === 0) {
    var prf = {};
    prf["entry.2108097200"] = "Unknown";
    prf["entry.1646195359"] = -1;
    prf["entry.1552249109"] = "Unknown";
    return [prf];
  }

  return [...prfs, ...rhts]
}

function getPRFContainer () {
  return $("#ChecklistsContainer")
    .find(`div[data-checklist-id]`)
    .has(`label:contains('PRF Number')`)
    .has(`label:contains('Triage')`);
}

function getRHTContainer () {
  return $("#ChecklistsContainer")
    .find(`div[data-checklist-id]`)
    .has(`label:contains('RHT Number')`)
    .has(`label:contains('Triage')`);
}

function processPRFs (prfFormContainer, isRHT) {
  var prfs = [];

  var numberField = (isRHT ? 'RHT Number' : 'PRF Number')

  if (prfFormContainer.length > 0) {
    for (var i = 0; i < prfFormContainer.length; i++) {
      if (
        prfFormContainer.find(`label:contains('${numberField}')`)[i].nextSibling
          .value.length > 0 &&
        typeof prfFormContainer.find(`label:contains('Triage')`)[i] !==
        "undefined"
      ) {
        var prf = {};
        prf["entry.666285626"] = (isRHT ? 'RHT' : '') + prfFormContainer.find(
          `label:contains('${numberField}')`
        )[i].nextSibling.value;
        prf["entry.2108097200"] = prfFormContainer.find(
          `label:contains('Triage')`
        )[i].nextSibling.value;
        prf["entry.847941590"] = prfFormContainer.find(
          `label:contains('Patient Gender')`
        )[i].nextSibling.value;
        prf["entry.1646195359"] = prfFormContainer.find(
          `label:contains('Patient Age (Years)')`
        )[i].nextSibling.value;
        prf["entry.1552249109"] = prfFormContainer.find(
          `label:contains('Patient Ethnic Group')`
        )[i].nextSibling.value;
        prf["entry.1883567358"] = "No"
        prfs.push(prf);
      }
    }
  }

  return prfs;
}

function buildEForm () {
  var vars = {};

  // Source
  const sourceElementLength = $("#DynamicListsContainer")
    .find(`div[data-groupid='319']`)
    .find(`label:contains('Call Source')`).length;

  if (sourceElementLength > 0) {
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

    vars["entry.1282291516"] = window.location.href

    vars["entry.1261286527"] = $("#DynamicListsContainer")
      .find(`div[data-groupid='319']`)
      .find(`label:contains('Call Source')`)[indexSource].nextSibling.innerText;

    vars["entry.1014478975"] = $("#DynamicListsContainer")
      .find(`div[data-groupid='319']`)
      .find(`label:contains('Call Source')`)[
      indexSourceOther
    ].nextSibling.innerText;

    if (vars["entry.1261286527"] === "External Agency (DOH)") {
      vars["entry.1261286527"] = "External Agency (DoH)";
    }
    if (vars["entry.1261286527"] === "Social Media (external)") {
      vars["entry.1261286527"] = "Social Media (External)";
    }
    if (
      vars["entry.1261286527"] === "Emergency Line" ||
      vars["entry.1261286527"] === "External Agency (DoH)" ||
      vars["entry.1261286527"] === "External Agency (ER24)"
    ) {
      vars["entry.1014478975"] = "Other";
    }
  }

  // Incident Number
  vars["entry.1654195642"] = $("#IncidentReference").html();

  // Call Type
  vars["entry.1655594278"] = extractCallTypeFromElement(
    $("#PrimaryComplaintTitle")
  );

  // Outcome call type
  vars["entry.624304548"] = vars["entry.1655594278"];

  // Metro Reference Number
  vars["entry.151097000"] = findMetroReferenceNumber();

  // Priority
  vars["entry.1375744071"] = $("#PrimaryComplaintTitle")[0].innerText.charAt(
    $("#PrimaryComplaintTitle")[0].innerText.length - 1
  );

  // Building Responder List
  let responders = [];
  let responderList = $("#ActiveRespondersPane").find(".scroller")[0].children;
  _cdlog("STARTEFORM: Responder List Length is: " + responderList.length);

  for (let i = 0; i < responderList.length; i++) {
    let element = responderList[i];
    let selectionList = $(element).find(".selection");
    if (selectionList.length === 0) {
      _cdlog("STARTEFORM: " + i + ": Ignored (No Selection)");
      continue;
    }

    let selection = selectionList[0];
    if (selection.innerText.indexOf("Unknown") >= 0) {
      _cdlog("STARTEFORM: " + i + ": Ignored (Responder set to Unknown)");
      continue;
    }
    const callsign = extractCallsignFromTimelineElement(element);
    if (callsign) {
      responders.push(callsign);
    } else {
      _cdlog("STARTEFORM: " + i + ": Could not get Callsign");
    }
  }
  if (responders.length === 0) {
    const closeReason = $("#closedReasonTitle").text()
    if (closeReason.substring(0, 10).toLowerCase() === 'outsourced') {
      vars["entry.1725583490"] = "None"
    }
  } else {
    vars["entry.1725583490"] = responders.join(",");
  }

  // Address
  vars["entry.895328514"] = $("#AddressLine").html();

  // Longitude & Latitude
  vars["entry.237290975"] = $("#AddressLineLatLng").html();

  // First On Scene
  if (!isResponseVehicleAssigned()) {
    const firstOnSceneTimeline = $("#timeline").find(
      `div.panel:contains(' - On Scene')`
    );
    if (firstOnSceneTimeline.length > 0) {
      const callsign = extractCallsignFromTimelineElement(
        firstOnSceneTimeline[firstOnSceneTimeline.length - 1]
      );
      if (callsign) {
        vars["entry.393375178"] = determineCallsignVehicle(callsign);
      } else {
        vars["entry.393375178"] = "No CM Resources";
      }
    } else {
      _cdlog("STARTEFORM: There was no history for First On Scene");
      vars["entry.393375178"] = "No CM Resources";
    }
  } else {
    _cdlog("STARTEFORM: Ignoring first on scene because an RV was assigned.");
  }

  // Close Reasons
  const closeReason = $("#closedReasonTitle").text()
  if (closeReason.substring(0, "patient refused".length).toLowerCase() === 'patient refused') {
    vars["entry.162948545"] = "RHT" // Outcome
    vars["entry.1807757148"] = "No Receiving Facility" // Destination Hospital
  } else if (closeReason.substring(0, "cancelled by".length).toLowerCase() === 'cancelled by') {
    vars["entry.666285626"] = "No PRF, Cancelled by Caller or Referring Service"
    vars["entry.162948545"] = "Cancelled by Caller or Referring Service" // Outcome
    vars["entry.2018139507"] = "No" // No Drugs
    vars["entry.1842118913"] = "No" // No Mistakes
    vars["entry.847941590"] = "No Patient"; // Triage
    vars["entry.1807757148"] = "No Receiving Facility" // Destination Hospital
  } else if (closeReason.toLowerCase() === 'conveyed By law enforcement/police') {
    vars["entry.162948545"] = "SAPS" // Outcome
  } else if (closeReason.toLowerCase() === 'conveyed By private transport') {
    vars["entry.162948545"] = "Transported Privately" // Outcome
  } else if (closeReason.toLowerCase() === 'declaration of death (doa)') {
    vars["entry.162948545"] = "FPS/DOA"
    vars["entry.1807757148"] = "No Receiving Facility" // Destination Hospital
  } else if (closeReason.toLowerCase() === 'nsr (no patient found)') {
    vars["entry.666285626"] = "No PRF, No Patient Found"
    vars["entry.162948545"] = "No Patient Found" // Outcome
    vars["entry.2018139507"] = "No" // No Drugs
    vars["entry.1842118913"] = "No" // No Mistakes
    vars["entry.847941590"] = "No Patient"; // Triage
    vars["entry.1807757148"] = "No Receiving Facility" // Destination Hospital
  } else if (closeReason.toLowerCase() === 'nsr (no scene found)') {
    vars["entry.666285626"] = "No PRF, No Scene Found"
    vars["entry.162948545"] = "No Scene Found" // Outcome
    vars["entry.2018139507"] = "No" // No Drugs
    vars["entry.1842118913"] = "No" // No Mistakes
    vars["entry.847941590"] = "No Patient"; // Triage
    vars["entry.1807757148"] = "No Receiving Facility" // Destination Hospital
  } else if (closeReason.toLowerCase() === 'Double Booking (Duplicated Call)') {
    vars["entry.666285626"] = "No PRF, Duplicate Incident"
    vars["entry.162948545"] = "Duplicate Incident" // Outcome
    vars["entry.2018139507"] = "No" // No Drugs
    vars["entry.1842118913"] = "No" // No Mistakes
    vars["entry.847941590"] = "No Patient"; // Triage
    vars["entry.1807757148"] = "No Receiving Facility" // Destination Hospital
  }

  var proceed = () => {
    vars["entry.524386880"] = findIncidentTime();
    const closeReason = $("#closedReasonTitle").text()
    if (closeReason.substring(0, 10).toLowerCase() === 'outsourced') {
      vars["entry.915011561"] = vars["entry.524386880"] // Paged Time
      vars["entry.835032369"] = vars["entry.524386880"] // Free Time
      vars["entry.666285626"] = "No PRF, Incident Outsourced"
      vars["entry.1883567358"] = "Yes"
      vars["entry.2018139507"] = "No" // No Drugs
      vars["entry.1842118913"] = "No" // No Mistakes
      vars["entry.27227789"] = "No" // No Induction
      vars["entry.1807757148"] = "Unknown" // Destination Hospital
      vars["entry.847941590"] = "Unknown"; // Triage
    }

    revealScheduledDate();

    var prfs = getPRFs();
    _cdlog("STARTEFORM: Found " + prfs.length + " PRFs");
    for (var i = 0; i < prfs.length; i++) {
      const allVars = Object.assign({}, vars, prfs[i]);
      _cdlog(allVars);
      var queryString = Object.keys(allVars)
        .map(function (key) {
          return key + "=" + encodeURIComponent(allVars[key]);
        })
        .join("&");

      const eFormURL =
        "https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&" +
        queryString;
      const accountChooserURL =
        "https://www.google.com/accounts/AccountChooser?Email=&continue=" +
        encodeURIComponent(eFormURL);

      _cdlog("STARTEFORM: eFormUrl: " + eFormURL);
      _cdlog("STARTEFORM: accountChooserURL: " + accountChooserURL);

      window.open(accountChooserURL);
    }
  };

  const whenYes = () => {
    // Incident Date
    vars["entry.2077619580"] = findIncidentDate()
    vars["entry.915011561"] = findIncidentTime()
    proceed();
  }

  const whenNo = () => {
    // Incident Date
    vars["entry.2077619580"] = incidentDateFromReference()

    let pagedTimeline = $("#timeline").find(
      `div.panel:contains('Incident Paged Out')`
    );
    if (pagedTimeline.length > 0) {
      vars["entry.915011561"] = extractTimeFromTimelineElement(
        "paged",
        pagedTimeline[pagedTimeline.length - 1]
      );
    }

    const mobileTimelineAccepted = $("#timeline").find(
      `div.panel:contains(' - Accepted')`
    );
    const mobileTimelineEnRoute = $("#timeline").find(
      `div.panel:contains(' - Enroute')`
    );
    let mobileTimeline;
    if (mobileTimelineAccepted.length === 0) {
      mobileTimeline = mobileTimelineEnRoute;
    } else if (mobileTimelineEnRoute.length === 0) {
      mobileTimeline = mobileTimelineAccepted;
    } else {
      mobileTimeline = findEarliestTimelineItem(
        mobileTimelineAccepted,
        mobileTimelineEnRoute
      );
    }
    if (mobileTimeline.length > 0) {
      vars["entry.295402896"] = extractTimeFromTimelineElement(
        "mobile",
        mobileTimeline[mobileTimeline.length - 1]
      );
    } else {
      _cdlog("STARTEFORM: There was no history for Mobile Time");
    }

    let onSceneTimeline = $("#timeline").find(
      `div.panel:contains(' - On Scene')`
    );
    if (onSceneTimeline.length > 0) {
      vars["entry.865471720"] = extractTimeFromTimelineElement(
        "on scene",
        onSceneTimeline[onSceneTimeline.length - 1]
      );
    } else {
      _cdlog("STARTEFORM: There was no history for On Scene Time");
    }

    alert("REMEMBER TO DOUBLE CHECK THE TIMES!!!");

    proceed();
  }

  // Get Times if it is not a backlogged incident
  const descriptionText = $("#Description").text().toLowerCase()
  if (descriptionText.indexOf('backlog') >= 0) {
    whenYes()
  } else {
    ConfirmDialog("Is this a backlogged incident?", whenYes, whenNo);
  }
}

function isResponseVehicleAssigned () {
  const mobileTimelineAccepted = $("#timeline").find(
    `div.panel:contains(' - Accepted')`
  );
  return mobileTimelineAccepted.length > 0;
}

function determineCallsignVehicle (callsign) {
  // WIP
  // let vehicles = $("#ActiveVehiclesPane").find(`div[data-type='Vehicle']`);
  // for (let i = 0; i < vehicles.length; i++) {
  // 	let vehicle = vehicles[i];
  // 	let vehicleLabelElement = vehicle.find('h5');
  // 	if (vehicleLabelElement) {
  // 		let vehicleLabel = vehicleLabelElement.innerText;
  // 		const firstTwoCharacters = callsign.substring(0,1);
  // 	}

  // }
  const firstTwoCharacters = callsign.substring(0, 1);
  if (
    firstTwoCharacters === "RV" ||
    firstTwoCharacters === "LC" ||
    firstTwoCharacters === "VP" ||
    firstTwoCharacters === "CS"
  ) {
    return callsign;
  } else {
    return "Private Vehicle";
  }
}

function extractTimeFromTimelineElement (name, timelineElement) {
  const TIME_PATTERN = /(\d{4}-\d{2}-\d{2})?\D+(\d{2}:\d{2})/g;
  let innerText = timelineElement.innerText;
  let match = TIME_PATTERN.exec(innerText);
  if (match) {
    _cdlog("STARTEFORM: Found " + name + " Time " + match[2]);
    return match[2];
  } else {
    _cdlog("STARTEFORM: No " + name + " Time found: " + innerText);
  }
  return "";
}

function extractCallTypeFromElement (primaryTypeElement) {
  const CALLTYPE_PATTERN = /(.+)<span/g;
  let htmlContent = primaryTypeElement.html();
  let match = CALLTYPE_PATTERN.exec(htmlContent);
  if (match) {
    const callType = unEntity(match[1]);
    _cdlog("STARTEFORM: Found Call Type " + callType);
    return callType;
  } else if (htmlContent.indexOf("<") === -1) {
    const callType = unEntity(htmlContent);
    _cdlog("STARTEFORM: Found Call Type " + callType);
    return callType;
  } else {
    _cdlog("STARTEFORM: No Call Type Found: " + htmlContent);
  }
  return "";
}

function extractCallsignFromTimelineElement (timelineElement) {
  const CALLSIGN_PATTERN = /([A-QS-Z][A-Z]\d{2,3})[\D$]/g;
  let innerText = timelineElement.innerText;
  let match = CALLSIGN_PATTERN.exec(innerText);
  if (match) {
    _cdlog("STARTEFORM: Found callsign " + match[1]);
    return match[1];
  } else {
    _cdlog("STARTEFORM: No callsign found: " + innerText);
  }
  return undefined;
}

function findEarliestTimelineItem (timelineList1, timelineList2) {
  if (
    timelineList1[timelineList1.length - 1].offsetTop >
    timelineList2[timelineList2.length - 1].offsetTop
  ) {
    return timelineList1;
  } else {
    return timelineList2;
  }
}

function findMetroReferenceNumber () {
  const METRO_REFERENCE_PATTERN = /DoH\ \-\ EMS\ \(Metro\)\ Ambulance\ Services.+(\d{4})/gi;
  let notes = $("#NotesTable").find(
    `div.row:contains('DOH - EMS (METRO) AMBULANCE SERVICES')`
  );
  if (notes.length === 0) {
    notes = $("#NotesTable").find(
      `div.row:contains('DoH - EMS (Metro) Ambulance Services')`
    );
  }
  for (let i = 0; i < notes.length; i++) {
    let innerText = notes[i].innerText;
    let match = METRO_REFERENCE_PATTERN.exec(innerText);
    if (match) {
      _cdlog("STARTEFORM: Found Metro Reference " + match[1]);
      return match[1];
    } else {
      _cdlog("STARTEFORM: No Metro Reference found: " + innerText);
    }
  }
  return "None";
}

function findIncidentDate () {
  const descriptionText = $("#Description").text()
  const MATCH_DATE_PATTERN = /BACKLOG.+(20\d{2}((0[1-9])|(1[0-2]))(([0-2][0-9])|(3[0-1])))/
  const PATTERN_GROUP = 1

  const match = MATCH_DATE_PATTERN.exec(descriptionText);
  if (match) {
    const s = match[PATTERN_GROUP]
    return [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8)].join("-");
  }
  return
}

function incidentDateFromReference () {
  var s = $("#IncidentReference")
    .html()
    .substring(
      0,
      $("#IncidentReference")
        .html()
        .indexOf("/")
    );
  return [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8)].join("-");

}

function findIncidentTime () {
  const INCIDENTTIME_PATTERN = /(^|\W)((I\W?T)|(Incident\s+Time))\W.+?(\d{2}[:h]\d{2})/gi;
  const PATTERN_GROUP = 5;

  // FIRST CHECK DESCRIPTION
  const descriptionText = $("#Description").text()

  const matchDescription = INCIDENTTIME_PATTERN.exec(descriptionText);
  if (matchDescription) {
    _cdlog("STARTEFORM: Found Incident Time in Description " + matchDescription[PATTERN_GROUP]);
    return matchDescription[PATTERN_GROUP];
  }

  const notes = $("#NotesTable").find("div >> p");

  for (let i = notes.length - 1; i >= 0; i--) {
    const innerText = notes[i].innerText;
    const match = INCIDENTTIME_PATTERN.exec(innerText);
    if (match) {
      const incidentTime = match[PATTERN_GROUP].replace('h', ':')
      _cdlog("STARTEFORM: Found Metro Reference " + incidentTime);
      return incidentTime;
    } else {
      _cdlog("STARTEFORM: No Metro Reference found: " + innerText);
    }
  }

  const incidentTimeStr = $("#ScheduleDateTime").html();
  const incidentSplit = incidentTimeStr.split(" ");
  const timeStr = incidentSplit[1];

  return timeStr;
}

function unEntity (str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function addEFormButton () {
  if ($("#ToggleStatus[data-statusid=1]").length > 0) {
    $(
      '<span id="StartEformMenu"><a class="btn btn-xs btn-default" href="javascript:buildEForm();" id="BuildEForm">Start eForm</a></span>'
    ).insertAfter("#ActiveOrderMenu");
    if ($("#BuildEForm").length === 0) {
      _cdlog("STARTEFORM: EForm Button Not Added, Trying again Later!");
      setTimeout(addEFormButton, 5000);
    } else {
      _cdlog("STARTEFORM: EForm Button Added");
      setTimeout(doubleCheckEformButtonExists, 10000);
    }
  } else {
    _cdlog("STARTEFORM: Incident not closed, Checking again Later!");
    setTimeout(addEFormButton, 5000);
  }
}

function doubleCheckEformButtonExists () {
  if ($("#BuildEForm").length === 0) {
    _cdlog(
      "STARTEFORM: DOUBLECHECK EForm Button Does Not Exist, Running Add Button Procedure!"
    );
    setTimeout(addEFormButton, 5000);
  } else {
    _cdlog("STARTEFORM: DOUBLECHECK EForm Button Exists");
    setTimeout(doubleCheckEformButtonExists, 10000);
  }
}

function revealScheduledDate () {
  if ($("#ScheduleDateContainer").length > 0) {
    $("#ScheduleDateContainer").show();
  } else {
    setTimeout(revealScheduledDate, 5000);
  }
}

function appendEformDialog (message) {
  $(
    '<div class="modal stick-up in" id="eFormYesNoDialog" style="display: none;"> \
		<div class="modal-dialog"> \
			<div class="modal-content"> \
				<div class="modal-header clearfix text-left"> \
					<div class="row"> \
						<div class="col-md-12"> \
							<h4>Question</h4> \
						</div> \
					</div> \
				</div> \
				<div class="modal-body"> \
					<div class="row"> \
						<div class="col-md-12"> \
							<p>' +
    message +
    '?</p> \
						</div> \
					</div> \
				</div> \
				<div class="panel-footer"> \
					<button type="button" id="eFormDialogYes" class="btn btn-primary btn-complete">Yes</button> \
					<button type="button" id="eFormDialogNo" class="btn btn-danger" data-dismiss="modal">No</button> \
				</div> \
			</div> \
		</div> \
	</div>'
  ).appendTo("body");
}

function showEformDialog () {
  $("#eFormYesNoDialog").show();
}

function destroyEformDialog () {
  $("#eFormYesNoDialog").remove();
}

function ConfirmDialog (message, yesCallback, noCallback) {
  appendEformDialog(message);
  $("#eFormDialogYes").click(function () {
    yesCallback();
    destroyEformDialog();
  });
  $("#eFormDialogNo").click(function () {
    noCallback();
    destroyEformDialog();
  });

  showEformDialog();
}

addEFormButton();

//////////////////////////////////////////////////////////////////////////////////////////////
// POST INCIDENT NUMBER & URL
//////////////////////////////////////////////////////////////////////////////////////////////

function postIncidentNumberWithUrl () {
  var incidentNumber = $("#IncidentReference").html()
  var incidentDate = findIncidentDate() || incidentDateFromReference()
  var Url = window.location.href
  var createdPerson = $(".profile-dropdown-toggle").text().trim()

  var serializedData = `action=add&IncidentNumber=${encodeURIComponent(incidentNumber)}` +
    `&IncidentDate=${encodeURIComponent(incidentDate)}` +
    `&URL=${encodeURIComponent(Url)}` +
    `&CreatedPerson=${encodeURIComponent(createdPerson)}`;

  var url = "https://script.google.com/macros/s/AKfycbyr-ScTDersx1PD1rd5qcqy1_uJ7sZ_J_SLXwsd8HDbWXX9bZs/exec?" + serializedData + "&callback=?";
  $.getJSON(url)
}

function waitForLoadAndPost () {
  if ($("#ToggleStatus[data-statusid=2]").length > 0) {

    postIncidentNumberWithUrl()
  } else {
    setTimeout(waitForLoadAndPost, 5000);
  }
}

waitForLoadAndPost()


//////////////////////////////////////////////////////////////////////////////////////////////
// HOOK INTO CLOSE BUTTON
//////////////////////////////////////////////////////////////////////////////////////////////
function closeHandler () {
  var incidentNumber = $("#IncidentReference").html()
  var dispatcher = $(".profile-dropdown-toggle").text().trim()
  var serializedData = `action=close&IncidentNumber=${encodeURIComponent(incidentNumber)}&dispatcher=${encodeURIComponent(dispatcher)}`

  var url = "https://script.google.com/macros/s/AKfycbyr-ScTDersx1PD1rd5qcqy1_uJ7sZ_J_SLXwsd8HDbWXX9bZs/exec?" + serializedData + "&callback=?";
  $.getJSON(url)
}

function checkAndHookIntoCloseButton () {
  if ($("#ToggleStatus[data-statusid=2]").length > 0) {
    var hooked = $("#ToggleStatus").attr('hooked')
    if (!hooked) {
      $("#ToggleStatus").click(closeHandler)
      $("#ToggleStatus").attr('hooked', true)
    }
  }

  setTimeout(checkAndHookIntoCloseButton, 1000);
}

checkAndHookIntoCloseButton()
