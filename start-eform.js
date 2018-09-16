/*
https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&
entry.1261286527=Emergency+Line&	 		-- $("#DynamicListsContainer").find(`div[data-groupid='319']`).find(`label:contains('Call Source')`)[0].nextSibling.innerText
entry.1014478975=Other&
entry.1772041708=West+Metro+(WC,+CPT)&
entry.1654195642=20123123/12&				-- $("#IncidentReference").html()
entry.2077619580=2018-01-01&				-- var s = $("#IncidentReference").html().substring(0, $("#IncidentReference").html().indexOf('/')); [s.slice(0, 4), s.slice(4,6), s.slice(6,8)].join('-');
entry.1655594278=Assault+-+Physical&
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

function getPRFs() {
	var prfs = [];

	var prfFormContainer = $('#ChecklistsContainer').find(`div[data-checklist-id]`);
	if (prfFormContainer.length > 0) {
		for (var i = 0; i < prfFormContainer.length; i++) {
			if (prfFormContainer.find(`label:contains('PRF Number')`)[i].nextSibling.value > 0) {
				var prf = {};
				prf['entry.666285626'] = prfFormContainer.find(`label:contains('PRF Number')`)[i].nextSibling.value; 
				prf['entry.2108097200'] = prfFormContainer.find(`label:contains('Triage')`)[i].nextSibling.value; 
				prf['entry.847941590'] = prfFormContainer.find(`label:contains('Patient Gender')`)[i].nextSibling.value; 
				prf['entry.1646195359'] = prfFormContainer.find(`label:contains('Patient Age (Years)')`)[i].nextSibling.value; 
				prf['entry.1552249109'] = prfFormContainer.find(`label:contains('Patient Ethnic Group')`)[i].nextSibling.value; 
				prfs.push(prf);
			}
		}
	}

	if (prfs.length === 0) {
		var prf = {};
		prf['entry.2108097200'] = 'Unknown'; 
		prf['entry.847941590'] = 'No Patient'; 
		prf['entry.1646195359'] = -1; 
		prf['entry.1552249109'] = 'Unknown'; 
		prfs.push(prf);
	}

	return prfs;
}

function buildEForm() {
	var vars = {};

	// Source
	vars['entry.1261286527'] = $('#DynamicListsContainer').find(`div[data-groupid='319']`).find(`label:contains('Call Source')`)[0].nextSibling.innerText;
	if (vars['entry.1261286527'] === 'External Agency (DOH)') {
		vars['entry.1261286527'] = 'External Agency (DoH)';
	}
	if (vars['entry.1261286527'] === 'Social Media (external)') {
		vars['entry.1261286527'] = 'Social Media (External)';
	}
	if (vars['entry.1261286527'] === 'Emergency Line' || vars['entry.1261286527'] === 'External Agency (DoH)' || vars['entry.1261286527'] === 'External Agency (ER24)') {
		vars['entry.1014478975'] = 'Other'
	}

	// Incident Number
	vars['entry.1654195642'] = $('#IncidentReference').html(); 
	
	// Incident Date
	var s = $('#IncidentReference').html().substring(0, $('#IncidentReference').html().indexOf('/')); 
	vars['entry.2077619580'] = [s.slice(0, 4), s.slice(4,6), s.slice(6,8)].join('-'); 
	
	// Priority
	vars['entry.1375744071'] = $('#PrimaryComplaintTitle')[0].innerText.charAt($('#PrimaryComplaintTitle')[0].innerText.length-1); 

	// Building Responder List
	let responders = []; 
	let responderList = $('#ActiveRespondersPane').find('.scroller')[0].children; 
	console.log('STARTEFORM: Responder List Length is: ' + responderList.length); 

	for (let i = 0; i < responderList.length; i++) { 
		let element = responderList[i];
		if (element.innerText.indexOf('Unknown') === -1) { 
			const callsign = extractCallsignFromTimelineElement(element);
			if (callsign) {
				responders.push(callsign); 
			}
		} else {
			console.log('STARTEFORM: ' + i + ': Ignored'); 
		} 
	} 
	vars['entry.1725583490'] = responders.join(','); 
	
	// Address
	vars['entry.895328514'] = $('#AddressLine').html();

	// Longitude & Latitude
	vars['entry.237290975'] = $('#AddressLineLatLng').html();

	// First On Scene
	if (!isResponseVehicleAssigned()) {
		const firstOnSceneTimeline = $('#timeline').find(`div.panel:contains(' - On Scene')`);
		if (firstOnSceneTimeline.length > 0) {
			const callsign = extractCallsignFromTimelineElement(firstOnSceneTimeline[firstOnSceneTimeline.length-1]);
			if (callsign) {
				vars['entry.393375178'] = determineCallsignVehicle(callsign);
			} else {
				vars['entry.393375178'] = "No CM Resources";
			}
		} else { 
			console.log('STARTEFORM: There was no history for First On Scene');
			vars['entry.393375178'] = "No CM Resources";
		} 
	} else { 
		console.log('STARTEFORM: Ignoring first on scene because an RV was assigned.');
	} 

	var proceed = () => {

		revealScheduledDate(); 

		var prfs = getPRFs();
		console.log('STARTEFORM: Found ' + prfs.length + ' PRFs');
		for (var i = 0; i < prfs.length; i++) {
			const allVars = Object.assign({}, vars, prfs[i]);
			console.log(allVars);
			var queryString = Object.keys(allVars).map(function(key) {
				return key + '=' + encodeURIComponent(allVars[key]);
			}).join('&');

			const eFormURL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&' + queryString;
			const accountChooserURL = 'https://accounts.google.com/AccountChooser/signinchooser?Email&flowName=GlifWebSignIn&flowEntry=AccountChooser&continue=' + encodeURIComponent(eFormURL);

			console.log('STARTEFORM: eFormUrl: ' + eFormURL);
			console.log('STARTEFORM: accountChooserURL: ' + accountChooserURL);

			window.open(accountChooserURL);
		}
	};

	// Get Times if it is not a backlogged incident
	ConfirmDialog('Is this a backlogged incident?', () => {proceed();}, () => {
		var incidentTimeStr = $('#ScheduleDateTime').html();
		var incidentSplit = incidentTimeStr.split(' ');
		var timeStr = incidentSplit[1];
		vars['entry.524386880'] = timeStr;

		let pagedTimeline = $('#timeline').find(`div.panel:contains('Incident Paged Out')`);
		vars['entry.915011561'] = extractTimeFromTimelineElement('paged', pagedTimeline[pagedTimeline.length-1]);

		const mobileTimelineAccepted = $('#timeline').find(`div.panel:contains(' - Accepted')`);
		const mobileTimelineEnRoute = $('#timeline').find(`div.panel:contains(' - Enroute')`);
		let mobileTimeline;
		if (mobileTimelineAccepted.length === 0) {
			mobileTimeline = mobileTimelineEnRoute;
		} else if (mobileTimelineEnRoute.length === 0){
			mobileTimeline = mobileTimelineAccepted;
		} else {
			mobileTimeline = findEarliestTimelineItem(mobileTimelineAccepted, mobileTimelineEnRoute);
		}
		if (mobileTimeline.length > 0) {
			vars['entry.295402896'] = extractTimeFromTimelineElement('mobile', mobileTimeline[mobileTimeline.length-1]);
		} else { 
			console.log('STARTEFORM: There was no history for Mobile Time'); 
		} 

		let onSceneTimeline = $('#timeline').find(`div.panel:contains(' - On Scene')`);
		if (onSceneTimeline.length > 0) {
			vars['entry.865471720'] = extractTimeFromTimelineElement('on scene', onSceneTimeline[onSceneTimeline.length-1]);
		} else { 
			console.log('STARTEFORM: There was no history for On Scene Time'); 
		} 

		alert('REMEMBER TO DOUBLE CHECK THE TIMES!!!');

		proceed();
	});
} 

function isResponseVehicleAssigned() {
	const mobileTimelineAccepted = $('#timeline').find(`div.panel:contains(' - Accepted')`);
	return mobileTimelineAccepted.length > 0;
}

function determineCallsignVehicle(callsign) {
	const firstTwoCharacters = callsign.substring(0,1);
	if (firstTwoCharacters === 'RV' || firstTwoCharacters === 'LC' || firstTwoCharacters === 'VP' || firstTwoCharacters === 'CS') {
		return callsign;
	} else {
		return "Private Vehicle";
	}
}

function extractTimeFromTimelineElement(name, timelineElement){
	const TIME_PATTERN = /(\d{4}-\d{2}-\d{2})?\D+(\d{2}:\d{2})/g;
	let innerText = timelineElement.innerText;
	let match = TIME_PATTERN.exec(innerText); 
	if (match) { 
		console.log('STARTEFORM: Found ' + name + ' Time ' + match[2]); 
		return match[2];
	} else { 
		console.log('STARTEFORM: No ' + name + ' Time found: ' + innerText); 
	} 
	return '';
}

function extractCallsignFromTimelineElement(timelineElement){
	const CALLSIGN_PATTERN = /([A-Z]{2}\d{2,3})[\D$]/g;
	let innerText = timelineElement.innerText;
	let match = CALLSIGN_PATTERN.exec(innerText); 
	if (match) { 
		console.log('STARTEFORM: Found callsign ' + match[1]); 
		return match[1];
	} else { 
		console.log('STARTEFORM: No callsign found: ' + innerText); 
	} 
	return undefined;
}

function findEarliestTimelineItem(timelineList1, timelineList2){
	if (timelineList1[timelineList1.length-1].offsetTop > timelineList2[timelineList2.length-1].offsetTop) { 
		return timelineList1;
	} else {
		return timelineList2;
	}
}

function addEFormButton() {
	$('<a class=\"btn btn-xs btn-default\" href=\"javascript:buildEForm();\" id=\"BuildEForm\">Start eForm</a>').insertAfter( '#ToggleStatus[data-statusid=1]' );
	if ($('#BuildEForm').length === 0) {
		//console.log('STARTEFORM: EForm Button Not Added, Trying again Later!');
		setTimeout(addEFormButton, 5000);
	} else {
		console.log('STARTEFORM: EForm Button Added');
	}
}

function revealScheduledDate() {
	if ($('#ScheduleDateContainer').length > 0) {
		$('#ScheduleDateContainer').show(); 
	} else { 
		setTimeout(revealScheduledDate, 5000);
	}
}

function ConfirmDialog(message, yesCallback, noCallback) {
	$('<div></div>').appendTo('body')
	.html('<div><h6>'+message+'?</h6></div>')
	.dialog({
		modal: true, title: 'Confirm?', zIndex: 10000, autoOpen: true,
		width: 'auto', resizable: false,
		buttons: {
			Yes: function () {
				yesCallback();
				$(this).dialog('close');
			},
			No: function () {
				noCallback();
				$(this).dialog('close');
			}
		},
		close: function (event, ui) {
			$(this).remove();
		}
	});
}

addEFormButton();