/* eslint-disable no-undef */
import * as scraper from './scraper.mjs'
/*
https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&
entry.1261286527=Emergency+Line&  -- $("#DynamicListsContainer").find(`div[data-groupid='319']`).find(`label:contains('Call Source')`)[0].nextSibling.innerText
entry.1014478975=Other&
entry.1772041708=West+Metro+(WC,+CPT)&
entry.1654195642=20123123/12& -- $("#IncidentReference").html()
entry.2077619580=2018-01-01&   -- var s = $("#IncidentReference").html().substring(0, $("#IncidentReference").html().indexOf('/')); [s.slice(0, 4), s.slice(4,6), s.slice(6,8)].join('-');
entry.1655594278=Assault+-+Physical&  -- $("#PrimaryComplaintTitle")[0].innerText
entry.1375744071=1&  -- $("#PrimaryComplaintTitle")[0].innerText.charAt($("#PrimaryComplaintTitle")[0].innerText.length-1)
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

const GOOGLE_FORM = {
  // Page 1
  INCIDENT_NUMBER: 'entry.1654195642',
  METRO_REF: 'entry.151097000',
  INCIDENT_URL: 'entry.1282291516',
  CALL_SOURCE: 'entry.1261286527',
  CALL_SOURCE_OTHER: 'entry.1014478975',
  CALL_TYPE: 'entry.1655594278',
  PRIORITY: 'entry.1375744071', // 1 or 2
  RESPONDERS: 'entry.1725583490',
  ADDRESS: 'entry.895328514',
  LONG_LAT: 'entry.237290975',
  INCIDENT_DATE: 'entry.2077619580',
  INCIDENT_TIME: 'entry.524386880',
  PAGED_TIME: 'entry.915011561',
  MOBILE_TIME: 'entry.295402896',
  ON_SCENE_TIME: 'entry.865471720',
  FREE_TIME: 'entry.835032369',

  // Page 2
  OUTCOME_CALL_TYPE: 'entry.624304548',
  PATIENT_TRIAGE: 'entry.2108097200',
  PATIENT_AGE: 'entry.1646195359',
  PATIENT_ETHNIC_GROUP: 'entry.1552249109',
  PATIENT_GENDER: 'entry.847941590',
  PRF_NUMBER: 'entry.666285626',
  PRF_DRUGS_USED: 'entry.2018139507', // Yes or No
  PRF_MISTAKES_DETECTED: 'entry.1842118913', // Yes or No
  INDUCTION_SHIFT: 'entry.27227789',
  VEHICLE_TYPE: 'entry.393375178', // The type of the vehicle first on scene (e.g. Private Vehicle)
  PATIENT_DESTINATION: 'entry.1807757148',
  OUTCOME: 'entry.162948545',
  CALL_OUTSOURCED: 'entry.1883567358' // Yes or No,
}

function _cdlog (text) {
  if (document.location.href.indexOf('cdinjector-debug=true') !== -1) {
    console.log(text)
  }
}

function getPRFs () {
  const prfs = processPRFs(getPRFContainer(), 'PRF')

  const rhts = processPRFs(getRHTContainer(), 'RHT')

  const metroPts = processPRFs(getMetroAmboContainer(), 'METRO')

  if (prfs.length === 0 && rhts.length === 0 && metroPts.length === 0) {
    const prf = {}
    prf[GOOGLE_FORM.PATIENT_TRIAGE] = 'Unknown'
    prf[GOOGLE_FORM.PATIENT_AGE] = -1
    prf[GOOGLE_FORM.PATIENT_ETHNIC_GROUP] = 'Unknown'
    return [prf]
  }

  return [...prfs, ...rhts, ...metroPts]
}

function getPRFContainer () {
  return $('#ChecklistsContainer')
    .find('div[data-checklist-id]')
    .has('label:contains(\'PRF Number\')')
    .has('label:contains(\'Triage\')')
}

function getRHTContainer () {
  return $('#ChecklistsContainer')
    .find('div[data-checklist-id]')
    .has('label:contains(\'RHT Number\')')
    .has('label:contains(\'Triage\')')
}

function getMetroAmboContainer () {
  return $('#ChecklistsContainer')
    .find('div[data-checklist-id]')
    .has('label:contains(\'SLIP Number\')')
    .has('label:contains(\'Triage\')')
}

function processPRFs (prfFormContainer, formType) {
  const prfs = []

  let numberField
  switch (formType) {
    case 'PRF': {
      numberField = 'PRF Number'
      break
    }
    case 'RHT': {
      numberField = 'RHT Number'
      break
    }
    case 'METRO': {
      numberField = 'SLIP Number'
      break
    }
  }

  if (prfFormContainer.length > 0) {
    for (let i = 0; i < prfFormContainer.length; i++) {
      if (
        prfFormContainer.find(`label:contains('${numberField}')`)[i].nextSibling
          .value.length > 0 &&
        typeof prfFormContainer.find('label:contains(\'Triage\')')[i] !==
        'undefined'
      ) {
        const prf = {}
        if (formType === 'RHT' || formType === 'PRF') {
          prf[GOOGLE_FORM.PRF_NUMBER] = (formType === 'RHT' ? 'RHT' : '') + prfFormContainer.find(
            `label:contains('${numberField}')`
          )[i].nextSibling.value
        } else {
          prf[GOOGLE_FORM.PRF_DRUGS_USED] = 'No' // No Drugs
          prf[GOOGLE_FORM.PRF_MISTAKES_DETECTED] = 'No' // No Mistakes
          prf[GOOGLE_FORM.VEHICLE_TYPE] = 'WCG Metro CM Ambulance' // Vehicle
          prf[GOOGLE_FORM.PRF_NUMBER] = 'No PRF, Pt treated by WCG Metro CM Ambulance' // PRF Number
          prf[GOOGLE_FORM.METRO_REF] = prfFormContainer.find(
            `label:contains('${numberField}')`
          )[i].nextSibling.value
        }
        prf[GOOGLE_FORM.PATIENT_TRIAGE] = prfFormContainer.find(
          'label:contains(\'Triage\')'
        )[i].nextSibling.value
        prf[GOOGLE_FORM.PATIENT_GENDER] = prfFormContainer.find(
          'label:contains(\'Patient Gender\')'
        )[i].nextSibling.value
        prf[GOOGLE_FORM.PATIENT_AGE] = prfFormContainer.find(
          'label:contains(\'Patient Age (Years)\')'
        )[i].nextSibling.value
        prf[GOOGLE_FORM.PATIENT_ETHNIC_GROUP] = prfFormContainer.find(
          'label:contains(\'Patient Ethnic Group\')'
        )[i].nextSibling.value
        prf[GOOGLE_FORM.CALL_OUTSOURCED] = 'No'
        prfs.push(prf)
      }
    }
  }

  return prfs
}

// eslint-disable-next-line no-unused-vars
function buildEForm () {
  const vars = {}

  vars[GOOGLE_FORM.INCIDENT_URL] = window.location.href

  // Source
  const sourceElementLength = $('#DynamicListsContainer')
    .find('div[data-groupid=\'319\']')
    .find('label:contains(\'Call Source\')').length

  if (sourceElementLength > 0) {
    let indexSource = 0
    for (let i = 0; i < sourceElementLength; i++) {
      const labelText = $('#DynamicListsContainer')
        .find('div[data-groupid=\'319\']')
        .find('label:contains(\'Call Source\')')[i].innerText
      if (labelText.toLowerCase() === 'call source') {
        indexSource = i
        break
      }
    }

    let indexSourceOther = 1
    for (let i = 0; i < sourceElementLength; i++) {
      const labelText = $('#DynamicListsContainer')
        .find('div[data-groupid=\'319\']')
        .find('label:contains(\'Call Source\')')[i].innerText
      if (labelText.toLowerCase() === 'call source other') {
        indexSourceOther = i
        break
      }
    }

    vars[GOOGLE_FORM.CALL_SOURCE] = $('#DynamicListsContainer')
      .find('div[data-groupid=\'319\']')
      .find('label:contains(\'Call Source\')')[indexSource].nextSibling.innerText

    vars[GOOGLE_FORM.CALL_SOURCE_OTHER] = $('#DynamicListsContainer')
      .find('div[data-groupid=\'319\']')
      .find('label:contains(\'Call Source\')')[
        indexSourceOther
      ].nextSibling.innerText

    if (vars[GOOGLE_FORM.CALL_SOURCE] === 'External Agency (DOH)') {
      vars[GOOGLE_FORM.CALL_SOURCE] = 'External Agency (DoH)'
    }
    if (vars[GOOGLE_FORM.CALL_SOURCE] === 'Social Media (external)') {
      vars[GOOGLE_FORM.CALL_SOURCE] = 'Social Media (External)'
    }
    if (
      vars[GOOGLE_FORM.CALL_SOURCE] === 'Emergency Line' ||
      vars[GOOGLE_FORM.CALL_SOURCE] === 'External Agency (DoH)' ||
      vars[GOOGLE_FORM.CALL_SOURCE] === 'External Agency (ER24)'
    ) {
      vars[GOOGLE_FORM.CALL_SOURCE_OTHER] = 'Other'
    }
  }

  // Incident Number
  vars[GOOGLE_FORM.INCIDENT_NUMBER] = scraper.getIncidentNumber($)

  // Call Type
  vars[GOOGLE_FORM.CALL_TYPE] = extractCallTypeFromElement(
    $('#PrimaryComplaintTitle')
  )

  // Outcome call type
  vars[GOOGLE_FORM.OUTCOME_CALL_TYPE] = vars[GOOGLE_FORM.CALL_TYPE]

  // Metro Reference Number
  vars[GOOGLE_FORM.METRO_REF] = findMetroReferenceNumber()

  // Priority
  vars[GOOGLE_FORM.PRIORITY] = $('#PrimaryComplaintTitle')[0].innerText.charAt(
    $('#PrimaryComplaintTitle')[0].innerText.length - 1
  )

  // Building Responder List
  const responders = []
  const responderList = $('#ActiveRespondersPane').find('.scroller')[0].children
  _cdlog('STARTEFORM: Responder List Length is: ' + responderList.length)

  for (let i = 0; i < responderList.length; i++) {
    const element = responderList[i]
    const selectionList = $(element).find('.selection')
    if (selectionList.length === 0) {
      _cdlog('STARTEFORM: ' + i + ': Ignored (No Selection)')
      continue
    }

    const selection = selectionList[0]
    if (selection.innerText.indexOf('Unknown') >= 0) {
      _cdlog('STARTEFORM: ' + i + ': Ignored (Responder set to Unknown)')
      continue
    }
    const callsign = extractCallsignFromTimelineElement(element)
    if (callsign) {
      responders.push(callsign)
    } else {
      _cdlog('STARTEFORM: ' + i + ': Could not get Callsign')
    }
  }
  if (responders.length === 0) {
    const closeReason = $('#closedReasonTitle').text()
    if (closeReason.substring(0, 10).toLowerCase() === 'outsourced') {
      vars[GOOGLE_FORM.RESPONDERS] = 'None'
    }
  } else {
    vars[GOOGLE_FORM.RESPONDERS] = responders.join(',')
  }

  // Address
  vars[GOOGLE_FORM.ADDRESS] = $('#AddressLine').html()

  // Longitude & Latitude
  vars[GOOGLE_FORM.LONG_LAT] = $('#AddressLineLatLng').html()

  // First On Scene
  const firstOnSceneTimeline = $('#timeline').find(
    'div.panel:contains(\' - On Scene\')'
  )
  if (firstOnSceneTimeline.length > 0) {
    const callsign = extractVehicleCallsignFromTimelineElement(
      firstOnSceneTimeline[firstOnSceneTimeline.length - 1]
    )
    if (callsign) {
      vars[GOOGLE_FORM.VEHICLE_TYPE] = determineCallsignVehicle(callsign)
    } else if (responders.length > 0) {
      vars[GOOGLE_FORM.VEHICLE_TYPE] = 'Private Vehicle'
    } else {
      vars[GOOGLE_FORM.VEHICLE_TYPE] = 'No CM Resources'
    }
  } else {
    _cdlog('STARTEFORM: There was no history for First On Scene')
    if (responders.length > 0) {
      vars[GOOGLE_FORM.VEHICLE_TYPE] = 'Private Vehicle'
    } else {
      vars[GOOGLE_FORM.VEHICLE_TYPE] = 'No CM Resources'
    }
  }

  // Close Reasons
  const closeReason = $('#closedReasonTitle').text()
  if (closeReason.substring(0, 'patient refused'.length).toLowerCase() === 'patient refused') {
    vars[GOOGLE_FORM.OUTCOME] = 'RHT' // Outcome
    vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'No Receiving Facility' // Destination Hospital
  } else if (closeReason.substring(0, 'cancelled by'.length).toLowerCase() === 'cancelled by') {
    vars[GOOGLE_FORM.PRF_NUMBER] = 'No PRF, Cancelled by Caller or Referring Service'
    vars[GOOGLE_FORM.OUTCOME] = 'Cancelled by Caller or Referring Service' // Outcome
    vars[GOOGLE_FORM.PRF_DRUGS_USED] = 'No' // No Drugs
    vars[GOOGLE_FORM.PRF_MISTAKES_DETECTED] = 'No' // No Mistakes
    vars[GOOGLE_FORM.PATIENT_GENDER] = 'No Patient' // Triage
    vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'No Receiving Facility' // Destination Hospital
  } else if (closeReason.toLowerCase() === 'conveyed By law enforcement/police') {
    vars[GOOGLE_FORM.OUTCOME] = 'SAPS' // Outcome
  } else if (closeReason.toLowerCase() === 'conveyed By private transport') {
    vars[GOOGLE_FORM.OUTCOME] = 'Transported Privately' // Outcome
  } else if (closeReason.toLowerCase() === 'declaration of death (doa)') {
    vars[GOOGLE_FORM.OUTCOME] = 'FPS/DOA'
    vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'No Receiving Facility' // Destination Hospital
  } else if (closeReason.toLowerCase() === 'nsr (no patient found)') {
    vars[GOOGLE_FORM.PRF_NUMBER] = 'No PRF, No Patient Found'
    vars[GOOGLE_FORM.OUTCOME] = 'No Patient Found' // Outcome
    vars[GOOGLE_FORM.PRF_DRUGS_USED] = 'No' // No Drugs
    vars[GOOGLE_FORM.PRF_MISTAKES_DETECTED] = 'No' // No Mistakes
    vars[GOOGLE_FORM.PATIENT_GENDER] = 'No Patient' // Triage
    vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'No Receiving Facility' // Destination Hospital
  } else if (closeReason.toLowerCase() === 'nsr (no scene found)') {
    vars[GOOGLE_FORM.PRF_NUMBER] = 'No PRF, No Scene Found'
    vars[GOOGLE_FORM.OUTCOME] = 'No Scene Found' // Outcome
    vars[GOOGLE_FORM.PRF_DRUGS_USED] = 'No' // No Drugs
    vars[GOOGLE_FORM.PRF_MISTAKES_DETECTED] = 'No' // No Mistakes
    vars[GOOGLE_FORM.PATIENT_GENDER] = 'No Patient' // Triage
    vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'No Receiving Facility' // Destination Hospital
  } else if (closeReason.toLowerCase() === 'Double Booking (Duplicated Call)') {
    vars[GOOGLE_FORM.PRF_NUMBER] = 'No PRF, Duplicate Incident'
    vars[GOOGLE_FORM.OUTCOME] = 'Duplicate Incident' // Outcome
    vars[GOOGLE_FORM.PRF_DRUGS_USED] = 'No' // No Drugs
    vars[GOOGLE_FORM.PRF_MISTAKES_DETECTED] = 'No' // No Mistakes
    vars[GOOGLE_FORM.PATIENT_GENDER] = 'No Patient' // Triage
    vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'No Receiving Facility' // Destination Hospital
  }

  const proceed = () => {
    vars[GOOGLE_FORM.INCIDENT_TIME] = findIncidentTime()
    const closeReason = $('#closedReasonTitle').text()
    if (closeReason.substring(0, 10).toLowerCase() === 'outsourced') {
      vars[GOOGLE_FORM.PAGED_TIME] = vars[GOOGLE_FORM.INCIDENT_TIME] // Paged Time
      vars[GOOGLE_FORM.FREE_TIME] = vars[GOOGLE_FORM.INCIDENT_TIME] // Free Time
      vars[GOOGLE_FORM.PRF_NUMBER] = 'No PRF, Incident Outsourced'
      vars[GOOGLE_FORM.CALL_OUTSOURCED] = 'Yes'
      vars[GOOGLE_FORM.PRF_DRUGS_USED] = 'No' // No Drugs
      vars[GOOGLE_FORM.PRF_MISTAKES_DETECTED] = 'No' // No Mistakes
      vars[GOOGLE_FORM.INDUCTION_SHIFT] = 'No' // No Induction
      vars[GOOGLE_FORM.PATIENT_DESTINATION] = 'Unknown' // Destination Hospital
      vars[GOOGLE_FORM.PATIENT_GENDER] = 'Unknown' // Triage
    }

    revealScheduledDate()

    const prfs = getPRFs()
    _cdlog('STARTEFORM: Found ' + prfs.length + ' PRFs')
    for (let i = 0; i < prfs.length; i++) {
      const allVars = Object.assign({}, vars, prfs[i])
      _cdlog(allVars)
      const queryString = Object.keys(allVars)
        .map(function (key) {
          return key + '=' + encodeURIComponent(allVars[key])
        })
        .join('&')

      const eFormURL =
        'https://docs.google.com/forms/d/e/1FAIpQLSdvItLqUEhOqDSqB1i7LwzyTFg2JHh9BphL7Dic0GunUucQ4A/viewform?usp=pp_url&' +
        queryString
      const accountChooserURL =
        'https://www.google.com/accounts/AccountChooser?Email=&continue=' +
        encodeURIComponent(eFormURL)

      _cdlog('STARTEFORM: eFormUrl: ' + eFormURL)
      _cdlog('STARTEFORM: accountChooserURL: ' + accountChooserURL)

      window.open(accountChooserURL)
    }
  }

  const whenYes = () => {
    // Incident Date
    vars[GOOGLE_FORM.INCIDENT_DATE] = findIncidentDate()
    vars[GOOGLE_FORM.PAGED_TIME] = findIncidentTime()
    proceed()
  }

  const whenNo = () => {
    // Incident Date
    vars[GOOGLE_FORM.INCIDENT_DATE] = incidentDateFromReference()

    const pagedTimeline = $('#timeline').find(
      'div.panel:contains(\'Incident Paged Out\')'
    )
    if (pagedTimeline.length > 0) {
      vars[GOOGLE_FORM.PAGED_TIME] = extractTimeFromTimelineElement(
        'paged',
        pagedTimeline[pagedTimeline.length - 1]
      )
    }

    const mobileTimelineAccepted = $('#timeline').find(
      'div.panel:contains(\' - Accepted\')'
    )
    const mobileTimelineEnRoute = $('#timeline').find(
      'div.panel:contains(\' - Enroute\')'
    )
    let mobileTimeline
    if (mobileTimelineAccepted.length === 0) {
      mobileTimeline = mobileTimelineEnRoute
    } else if (mobileTimelineEnRoute.length === 0) {
      mobileTimeline = mobileTimelineAccepted
    } else {
      mobileTimeline = findEarliestTimelineItem(
        mobileTimelineAccepted,
        mobileTimelineEnRoute
      )
    }
    if (mobileTimeline.length > 0) {
      vars[GOOGLE_FORM.MOBILE_TIME] = extractTimeFromTimelineElement(
        'mobile',
        mobileTimeline[mobileTimeline.length - 1]
      )
    } else {
      _cdlog('STARTEFORM: There was no history for Mobile Time')
    }

    const onSceneTimeline = $('#timeline').find(
      'div.panel:contains(\' - On Scene\')'
    )
    if (onSceneTimeline.length > 0) {
      vars[GOOGLE_FORM.ON_SCENE_TIME] = extractTimeFromTimelineElement(
        'on scene',
        onSceneTimeline[onSceneTimeline.length - 1]
      )
    } else {
      _cdlog('STARTEFORM: There was no history for On Scene Time')
    }

    alert('REMEMBER TO DOUBLE CHECK THE TIMES!!!')

    proceed()
  }

  // Get Times if it is not a backlogged incident
  const descriptionText = $('#Description').text().toLowerCase()
  if (descriptionText.indexOf('backlog') >= 0) {
    whenYes()
  } else {
    ConfirmDialog('Is this a backlogged incident?', whenYes, whenNo)
  }
}

// function isResponseVehicleAssigned () {
//   const mobileTimelineAccepted = $('#timeline').find(
//     'div.panel i.fa-car'
//   )
//   return mobileTimelineAccepted.length > 0
// }

function determineCallsignVehicle (callsign) {
  // WIP
  // let vehicles = $("#ActiveVehiclesPane").find(`div[data-type='Vehicle']`);
  // for (let i = 0; i < vehicles.length; i++) {
  //  let vehicle = vehicles[i];
  //  let vehicleLabelElement = vehicle.find('h5');
  //  if (vehicleLabelElement) {
  //   let vehicleLabel = vehicleLabelElement.innerText;
  //   const firstTwoCharacters = callsign.substring(0,1);
  //  }
  // }
  const firstTwoCharacters = callsign.substring(0, 2)
  if (
    firstTwoCharacters === 'RV' ||
    firstTwoCharacters === 'LC' ||
    firstTwoCharacters === 'VP' ||
    firstTwoCharacters === 'CS'
  ) {
    return callsign
  } else {
    return 'Private Vehicle'
  }
}

function extractTimeFromTimelineElement (name, timelineElement) {
  const TIME_PATTERN = /(\d{4}-\d{2}-\d{2})?\D+(\d{2}:\d{2})/g
  const innerText = timelineElement.innerText
  const match = TIME_PATTERN.exec(innerText)
  if (match) {
    _cdlog('STARTEFORM: Found ' + name + ' Time ' + match[2])
    return match[2]
  } else {
    _cdlog('STARTEFORM: No ' + name + ' Time found: ' + innerText)
  }
  return ''
}

function extractCallTypeFromElement (primaryTypeElement) {
  const CALLTYPE_PATTERN = /(.+)<span/g
  const htmlContent = primaryTypeElement.html()
  const match = CALLTYPE_PATTERN.exec(htmlContent)
  if (match) {
    const callType = unEntity(match[1])
    _cdlog('STARTEFORM: Found Call Type ' + callType)
    return callType
  } else if (htmlContent.indexOf('<') === -1) {
    const callType = unEntity(htmlContent)
    _cdlog('STARTEFORM: Found Call Type ' + callType)
    return callType
  } else {
    _cdlog('STARTEFORM: No Call Type Found: ' + htmlContent)
  }
  return ''
}

function extractCallsignFromTimelineElement (timelineElement, includeRV) {
  const CALLSIGN_PATTERN = ((includeRV) ? /([A-Z][A-Z]\d{2,3})(\D|$)/g : /([A-QS-Z][A-Z]\d{2,3})(\D|$)/g)
  const innerText = timelineElement.innerText
  let match
  let callsign
  while ((match = CALLSIGN_PATTERN.exec(innerText)) !== null) {
    if ((includeRV && match[1].startsWith('RV')) || (!includeRV)) {
      _cdlog('STARTEFORM: Found callsign ' + match[1])
      return match[1]
    }

    if (!callsign) {
      _cdlog('STARTEFORM: Found callsign ' + match[1])
      callsign = match[1]
    }
  }

  if (!callsign) {
    _cdlog('STARTEFORM: No callsign found: ' + innerText)
  }

  return callsign
}

function extractVehicleCallsignFromTimelineElement (timelineElement) {
  const callsignElements = $(timelineElement).find('div:has(div:has(i.fa-car))')
  if (callsignElements.length > 0) {
    const callsign = extractCallsignFromTimelineElement(callsignElements[0], true)
    if (callsign !== undefined) {
      return callsign
    }
  }
  return extractCallsignFromTimelineElement(timelineElement, true)
}

function findEarliestTimelineItem (timelineList1, timelineList2) {
  if (
    timelineList1[timelineList1.length - 1].offsetTop >
    timelineList2[timelineList2.length - 1].offsetTop
  ) {
    return timelineList1
  } else {
    return timelineList2
  }
}

function findMetroReferenceNumber () {
  const METRO_REFERENCE_PATTERN = /DoH - EMS \(Metro\) Ambulance Services.+(\d{4})/gi
  let notes = $('#NotesTable').find(
    'div.row:contains(\'DOH - EMS (METRO) AMBULANCE SERVICES\')'
  )
  if (notes.length === 0) {
    notes = $('#NotesTable').find(
      'div.row:contains(\'DoH - EMS (Metro) Ambulance Services\')'
    )
  }
  if (notes.length === 0) {
    notes = $('#timeline').find(
      'div.panel:contains(\'DoH - EMS (Metro) Ambulance Services\')'
    )
  }
  for (let i = 0; i < notes.length; i++) {
    const innerText = notes[i].innerText
    const match = METRO_REFERENCE_PATTERN.exec(innerText)
    if (match) {
      _cdlog('STARTEFORM: Found Metro Reference ' + match[1])
      return match[1]
    } else {
      _cdlog('STARTEFORM: No Metro Reference found: ' + innerText)
    }
  }
  return 'None'
}

function findIncidentDate () {
  const descriptionText = $('#Description').text()
  const MATCH_DATE_PATTERN = /BACKLOG.+(20\d{2}((0[1-9])|(1[0-2]))(([0-2][0-9])|(3[0-1])))/
  const PATTERN_GROUP = 1

  const match = MATCH_DATE_PATTERN.exec(descriptionText)
  if (match) {
    const s = match[PATTERN_GROUP]
    return [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8)].join('-')
  }
}

function incidentDateFromReference () {
  const s = $('#IncidentReference')
    .html()
    .substring(
      0,
      $('#IncidentReference')
        .html()
        .indexOf('/')
    )
  return [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8)].join('-')
}

function findIncidentTime () {
  const INCIDENTTIME_PATTERN = /(^|\W)((I\W?T)|(Incident\s+Time))\W.+?(\d{2}[:h]\d{2})/gi
  const PATTERN_GROUP = 5

  // FIRST CHECK DESCRIPTION
  const descriptionText = $('#Description').text()

  const matchDescription = INCIDENTTIME_PATTERN.exec(descriptionText)
  if (matchDescription) {
    _cdlog('STARTEFORM: Found Incident Time in Description ' + matchDescription[PATTERN_GROUP])
    return matchDescription[PATTERN_GROUP]
  }

  const notes = $('#NotesTable').find('div >> p')

  for (let i = notes.length - 1; i >= 0; i--) {
    const innerText = notes[i].innerText
    const match = INCIDENTTIME_PATTERN.exec(innerText)
    if (match) {
      const incidentTime = match[PATTERN_GROUP].replace('h', ':')
      _cdlog('STARTEFORM: Found Metro Reference ' + incidentTime)
      return incidentTime
    } else {
      _cdlog('STARTEFORM: No Metro Reference found: ' + innerText)
    }
  }

  const incidentTimeStr = $('#ScheduleDateTime').html()
  const incidentSplit = incidentTimeStr.split(' ')
  const timeStr = incidentSplit[1]

  return timeStr
}

function unEntity (str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function addEFormButton () {
  if ($('#ToggleStatus[data-statusid=1]').length > 0) {
    $(
      '<span id="StartEformMenu"><a class="btn btn-xs btn-default" href="javascript:buildEForm();" id="BuildEForm">Start eForm</a></span>'
    ).insertAfter('#ActiveOrderMenu')
    if ($('#BuildEForm').length === 0) {
      _cdlog('STARTEFORM: EForm Button Not Added, Trying again Later!')
      setTimeout(addEFormButton, 5000)
    } else {
      _cdlog('STARTEFORM: EForm Button Added')
      setTimeout(doubleCheckEformButtonExists, 10000)
    }
  } else {
    _cdlog('STARTEFORM: Incident not closed, Checking again Later!')
    setTimeout(addEFormButton, 5000)
  }
}

function doubleCheckEformButtonExists () {
  if ($('#BuildEForm').length === 0) {
    _cdlog(
      'STARTEFORM: DOUBLECHECK EForm Button Does Not Exist, Running Add Button Procedure!'
    )
    setTimeout(addEFormButton, 5000)
  } else {
    _cdlog('STARTEFORM: DOUBLECHECK EForm Button Exists')
    setTimeout(doubleCheckEformButtonExists, 10000)
  }
}

function revealScheduledDate () {
  if ($('#ScheduleDateContainer').length > 0) {
    $('#ScheduleDateContainer').show()
  } else {
    setTimeout(revealScheduledDate, 5000)
  }
}

function appendEformDialog (message) {
  $(
    `<div class="modal stick-up in" id="eFormYesNoDialog" style="display: none;">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header clearfix text-left">
          <div class="row">
            <div class="col-md-12">
              <h4>Question</h4>
            </div>
          </div>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-12">
              <p>${message}?</p>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button type="button" id="eFormDialogYes" class="btn btn-primary btn-complete">Yes</button>
          <button type="button" id="eFormDialogNo" class="btn btn-danger" data-dismiss="modal">No</button>
        </div>
      </div>
    </div>
  </div>`
  ).appendTo('body')
}

function showEformDialog () {
  $('#eFormYesNoDialog').show()
}

function destroyEformDialog () {
  $('#eFormYesNoDialog').remove()
}

function ConfirmDialog (message, yesCallback, noCallback) {
  appendEformDialog(message)
  $('#eFormDialogYes').click(function () {
    yesCallback()
    destroyEformDialog()
  })
  $('#eFormDialogNo').click(function () {
    noCallback()
    destroyEformDialog()
  })

  showEformDialog()
}

addEFormButton()

/// ///////////////////////////////////////////////////////////////////////////////////////////
// POST INCIDENT NUMBER & URL
/// ///////////////////////////////////////////////////////////////////////////////////////////

function postIncidentNumberWithUrl () {
  const incidentNumber = $('#IncidentReference').text()
  const incidentDate = findIncidentDate() || incidentDateFromReference()
  const Url = window.location.href
  const createdPerson = $('.profile-dropdown-toggle').text().trim()

  const serializedData = `action=add&IncidentNumber=${encodeURIComponent(incidentNumber)}` +
    `&IncidentDate=${encodeURIComponent(incidentDate)}` +
    `&URL=${encodeURIComponent(Url)}` +
    `&CreatedPerson=${encodeURIComponent(createdPerson)}`

  const url = 'https://script.google.com/macros/s/AKfycbyr-ScTDersx1PD1rd5qcqy1_uJ7sZ_J_SLXwsd8HDbWXX9bZs/exec?' + serializedData + '&callback=?'
  $.getJSON(url)
}

function waitForLoadAndPost () {
  if ($('#ToggleStatus[data-statusid=2]').length > 0) {
    postIncidentNumberWithUrl()
  } else {
    setTimeout(waitForLoadAndPost, 5000)
  }
}

waitForLoadAndPost()

/// ///////////////////////////////////////////////////////////////////////////////////////////
// HOOK INTO CLOSE BUTTON
/// ///////////////////////////////////////////////////////////////////////////////////////////
function closeHandler () {
  const incidentNumber = $('#IncidentReference').html()
  const dispatcher = $('.profile-dropdown-toggle').text().trim()
  const serializedData = `action=close&IncidentNumber=${encodeURIComponent(incidentNumber)}&dispatcher=${encodeURIComponent(dispatcher)}`

  const url = 'https://script.google.com/macros/s/AKfycbyr-ScTDersx1PD1rd5qcqy1_uJ7sZ_J_SLXwsd8HDbWXX9bZs/exec?' + serializedData + '&callback=?'
  $.getJSON(url)
}

function checkAndHookIntoCloseButton () {
  if ($('#ToggleStatus[data-statusid=2]').length > 0) {
    const hooked = $('#ToggleStatus').attr('hooked')
    if (!hooked) {
      $('#ToggleStatus').click(closeHandler)
      $('#ToggleStatus').attr('hooked', true)
    }
  }

  setTimeout(checkAndHookIntoCloseButton, 1000)
}

checkAndHookIntoCloseButton()
