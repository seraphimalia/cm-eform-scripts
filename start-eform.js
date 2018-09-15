function getPRFs() {
    var prfs = [];

    var prfFormContainer = $('#ChecklistsContainer').find(`div[data-checklist-id]`);
    if (prfFormContainer.length > 0) {
        for (var i = 0; i < prfFormContainer.length; i++) {
            var prf = {};
            prf['entry.666285626'] = prfFormContainer.find(`label:contains('PRF Number')`)[i].nextSibling.value; 
            prf['entry.2108097200'] = prfFormContainer.find(`label:contains('Triage')`)[i].nextSibling.value; 
            prf['entry.847941590'] = prfFormContainer.find(`label:contains('Patient Gender')`)[i].nextSibling.value; 
            prf['entry.1646195359'] = prfFormContainer.find(`label:contains('Patient Age (Years)')`)[i].nextSibling.value; 
            prf['entry.1552249109'] = prfFormContainer.find(`label:contains('Patient Ethnic Group')`)[i].nextSibling.value; 
            prfs.push(prf);
        }
	} else {
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
			let re = /([A-Z]{2}\\d{2,3})[\\D$]/g; 
            let m = re.exec(element.innerText); 
			if (m) { 
                console.log('STARTEFORM: ' + i + ': Found ' + m[1]); 
			    responders.push(m[1]); 
			} else { 
                console.log('STARTEFORM: ' + i + ': No Callsign Found in text: ' + element.innerText); 
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

	var proceed = () => {

        revealScheduledDate(); 

        var prfs = getPRFs();
        console.log('STARTEFORM: Found ' + prfs.length + ' PRFs');
        for (var i = 0; i < prfs.length; i++) {
            const allVars = Object.assign({}, vars, prfs[1]);
            console.log(allVars);
            var queryString = Object.keys(allVars).map(function(key) {
                return key + '=' + allVars[key]
            }).join('&');
    
            window.open('https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&' + queryString);
        }
	};

    // Get Times if it is not a backlogged incident
	ConfirmDialog('Is this a backlogged incident?', () => {proceed();}, () => {
		var incidentTimeStr = $('#ScheduleDateTime').html();
		var incidentSplit = incidentTimeStr.split(' ');
		var timeStr = incidentSplit[1];
		vars['entry.524386880'] = timeStr;

		let pagedTimeline = $('#timeline').find(`div.panel:contains('Incident Paged Out')`);
		let pagedStr = pagedTimeline[pagedTimeline.length-1].innerText;
		let rePaged = /(\\d{4}-\\d{2}-\\d{2})?\\D+(\\d{2}:\\d{2})/g; 
		let mPaged = rePaged.exec(pagedStr); 
		if (mPaged) { 
			console.log('STARTEFORM: Found Paged Time ' + mPaged[2]); 
			vars['entry.915011561'] = mPaged[2];
		} else { 
			console.log('STARTEFORM: No Paged Time found: ' + pagedStr); 
		} 

		let mobileTimeline = $('#timeline').find(`div.panel:contains(' - Accepted')`);
		if (mobileTimeline.length === 0) {
			let mobileTimeline = $('#timeline').find(`div.panel:contains(' - Enroute')`);
		} 
		if (mobileTimeline.length > 0) {
			let mobileStr = mobileTimeline[mobileTimeline.length-1].innerText;
			let reMobile = /(\\d{4}-\\d{2}-\\d{2})?\\D+(\\d{2}:\\d{2})/g; 
			let mMobile = reMobile.exec(mobileStr); 
			if (mMobile) { 
				console.log('STARTEFORM: Found Mobile Time ' + mMobile[2]); 
				vars['entry.295402896'] = mMobile[2];
			} else { 
				console.log('STARTEFORM: No Mobile Time found: ' + mobileStr); 
			} 
		} else { 
			console.log('STARTEFORM: There was no history for Mobile Time'); 
		} 

		let onSceneTimeline = $('#timeline').find(`div.panel:contains(' - On Scene')`);
		if (onSceneTimeline.length > 0) {
			let onSceneStr = onSceneTimeline[onSceneTimeline.length-1].innerText;
			let reOnScene = /(\\d{4}-\\d{2}-\\d{2})?\\D+(\\d{2}:\\d{2})/g; 
			let mOnScene = reOnScene.exec(onSceneStr); 
			if (mOnScene) { 
				console.log('STARTEFORM: Found On Scene Time ' + mOnScene[2]); 
				vars['entry.865471720'] = mOnScene[2];
			} else { 
				console.log('STARTEFORM: No On Scene Time found: ' + onSceneStr); 
			} 
		} else { 
			console.log('STARTEFORM: There was no history for On Scene Time'); 
		} 

		alert('REMEMBER TO DOUBLE CHECK THE TIMES!!!');

		proceed();
	});
} 

function addEFormButton() {
	$('<a class=\"btn btn-xs btn-default\" href=\"javascript:buildEForm();\" id=\"BuildEForm\">Start eForm</a>').insertAfter( '#ToggleStatus[data-statusid=1]' );
	if ($('#BuildEForm').length === 0) {
		console.log('STARTEFORM: EForm Button Not Added, Trying again Later!');
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