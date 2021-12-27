export default class {
  constructor (jquery, logger) {
    this.$ = jquery
    this.logger = logger.extend('scraper')
  }

  countExpectedForms () {
    return this.getPRFContainer().length + this.getRHTContainer().length + this.getMetroAmboContainer().length
  }

  getIncidentNumber () {
    return this.$('#IncidentReference').html()
  }

  findIncidentDate () {
    // FIRST CHECK DESCRIPTION
    const descriptionText = this.$('#Description').text()
    const MATCH_DATE_PATTERN = /BACKLOG.+(20\d{2}((0[1-9])|(1[0-2]))(([0-2][0-9])|(3[0-1])))/
    const PATTERN_GROUP = 1

    const match = MATCH_DATE_PATTERN.exec(descriptionText)
    if (match) {
      const s = match[PATTERN_GROUP]
      return [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8)].join('-')
    }

    // THEN CHECK WINDOW OBJECT
    if (
      window &&
      window.IncidentObject &&
      window.IncidentObject.Incident &&
      window.IncidentObject.Incident.TimeStamp &&
      window.IncidentObject.Incident.TimeStamp.indexOf('T') > 0
    ) {
      return window.IncidentObject.Incident.TimeStamp.split('T')[0]
    }

    // THEN CHECK TIMELINE
    const incidentNumber = this.getIncidentNumber()
    const createdTimeline = this.$('#timeline').find(`div.panel:contains('Incident ${incidentNumber} created')`)
    if (createdTimeline.length > 0) {
      return this.extractDateFromTimelineElement('paged', createdTimeline[createdTimeline.length - 1])
    }

    return ''
  }

  getLocationCoordinates () {
    return this.$('#AddressLineLatLng').html()
  }

  getIncidentLink () {
    return window.location.href
  }

  getCallSource () {
    const $ = this.$
    const sourceElementLength = $('#DynamicListsContainer')
      .find("div[data-groupid='319']")
      .find("label:contains('Call Source')").length

    if (sourceElementLength > 0) {
      let indexSource = 0
      for (let i = 0; i < sourceElementLength; i++) {
        const labelText = $('#DynamicListsContainer')
          .find("div[data-groupid='319']")
          .find("label:contains('Call Source')")[i].innerText
        if (labelText.toLowerCase() === 'call source') {
          indexSource = i
          break
        }
      }

      return $('#DynamicListsContainer')
        .find("div[data-groupid='319']")
        .find("label:contains('Call Source')")[indexSource].nextSibling.innerText
    }
  }

  findIncidentTime () {
    const $ = this.$
    const logger = this.logger

    const INCIDENTTIME_PATTERN = /(^|\W)((I\W?T)|(Incident\s+Time)|(BACKLOG))\W.+?(\d{2}[:h]\d{2})/gi
    const PATTERN_GROUP = 6

    // FIRST CHECK DESCRIPTION
    const descriptionText = $('#Description').text()

    const matchDescription = INCIDENTTIME_PATTERN.exec(descriptionText)
    if (matchDescription) {
      logger.debug('Found Incident Time in Description ' + matchDescription[PATTERN_GROUP])
      return matchDescription[PATTERN_GROUP]
    }

    // THEN CHECK NOTES
    const notes = $('#NotesTable').find('div >> p')

    for (let i = notes.length - 1; i >= 0; i--) {
      const innerText = notes[i].innerText
      const match = INCIDENTTIME_PATTERN.exec(innerText)
      if (match) {
        const incidentTime = match[PATTERN_GROUP].replace('h', ':')
        logger.debug('Found Incident Time ' + incidentTime)
        return incidentTime
      } else {
        logger.debug('Incident time could not be found in the notes table: ' + innerText)
      }
    }

    // THEN CHECK WINDOW OBJECT
    if (
      window &&
      window.IncidentObject &&
      window.IncidentObject.Incident &&
      window.IncidentObject.Incident.TimeStamp &&
      window.IncidentObject.Incident.TimeStamp.indexOf('T') > 0
    ) {
      return window.IncidentObject.Incident.TimeStamp.split('T')[1].substring(0, 5)
    }

    // THEN CHECK HIDDEN DATE FIELD
    const incidentTimeStr = $('#ScheduleDateTime').html()
    const incidentSplit = incidentTimeStr.split(' ')
    const timeStr = incidentSplit[1]

    return timeStr
  }

  findPagedTime (isBacklogged) {
    if (isBacklogged) {
      return this.findIncidentTime()
    }

    // Look for Incident Paged Out
    const pagedTimeline = this.$('#timeline').find("div.panel:contains('Incident Paged Out')")
    if (pagedTimeline.length > 0) {
      return this.extractTimeFromTimelineElement('paged', pagedTimeline[pagedTimeline.length - 1])
    }

    // Look for Incident ${IncidentNumber} created
    const incidentNumber = this.getIncidentNumber()
    const createdTimeline = this.$('#timeline').find(`div.panel:contains('Incident ${incidentNumber} created')`)
    if (createdTimeline.length > 0) {
      return this.extractTimeFromTimelineElement('paged', createdTimeline[createdTimeline.length - 1])
    }

    return ''
  }

  getCallType () {
    return this.extractCallTypeFromElement(this.$('#PrimaryComplaintTitle'))
  }

  getPriority () {
    return this.$('#PrimaryComplaintTitle')
      .find('span')
      .text()
      .toLowerCase()
      .replace('priority', '')
  }

  getLocationAddress () {
    return this.$('#AddressLine').html()
  }

  getIncidentDescription () {
    return this.$('#Description').text()
  }

  getFirstCMVehicleOnScene () {
    const $ = this.$

    // First check timeline
    const firstOnSceneTimeline = $('#timeline').find("div.panel:contains('unit status changed On Scene')")
    const interestingOnSceneTimeStamps = []
    if (firstOnSceneTimeline.length > 0) {
      interestingOnSceneTimeStamps.push({
        callsign: this.extractCallsignFromTimelineElement(firstOnSceneTimeline[firstOnSceneTimeline.length - 1], true),
        time: this.extractTimeFromTimelineElement('firstOnScene', firstOnSceneTimeline[firstOnSceneTimeline.length - 1])
      })
    } else {
      this.logger.debug('There was no timeline history for First On Scene')
    }

    // Then check notes text
    const notes = $('#NotesTable')
      .find('div >> p')
      .filter(function () {
        return this.innerText.match(/((\sOn\sScene)|(\sAlpha))/gi)
      })

    for (let i = notes.length - 1; i >= 0; i--) {
      const callsign = this.extractCallsignFromTimelineElement(notes[i], true)
      if (this.isCMCallsign(callsign, true)) {
        interestingOnSceneTimeStamps.push({
          callsign,
          time: this.extractTimeFromTimelineElement('firstOnScene', notes[i])
        })
      }
    }

    // Then check stamped notes text
    const stampedNotes = $('#NotesTable')
      .children()
      .filter(function () {
        return this.innerText.match(/((\sOn\sScene)|(\sAlpha))/gi)
      })

    for (let i = stampedNotes.length - 1; i >= 0; i--) {
      const callsign = this.extractCallsignFromTimelineElement(stampedNotes[i], true)
      if (this.isCMCallsign(callsign, true)) {
        interestingOnSceneTimeStamps.push({
          callsign,
          time: this.extractTimeFromTimelineElement('firstOnScene', stampedNotes[i])
        })
      }
    }

    const getEarliestTimestampIndex = timeStamps => {
      if (timeStamps.length === 0) {
        return -1
      }

      let index = 0
      for (let i = 1; i < timeStamps.length; i++) {
        if (timeStamps[index].time > timeStamps[i].time) {
          index = i
        }
      }
      return index
    }

    if (interestingOnSceneTimeStamps.length > 0) {
      const earliestTimestampIndex = getEarliestTimestampIndex(interestingOnSceneTimeStamps)
      return this.determineCallsignVehicle(interestingOnSceneTimeStamps[earliestTimestampIndex].callsign)
    }

    // TEMPORARILY DESABLED because of RD bug that marks all responders as departed when closing call.
    // if (this.countResponders() > 0) {
    //  return 'Private Vehicle'
    // }

    return ''
  }

  getResponderCallsigns () {
    const $ = this.$
    const logger = this.logger

    const responders = []
    const responderList = $('#ActiveRespondersPane').find('.scroller')[0].children
    logger.debug('Responder List Length is: ' + responderList.length)

    for (let i = 0; i < responderList.length; i++) {
      const element = responderList[i]
      const selectionList = $(element).find('.selection')
      if (selectionList.length === 0) {
        logger.debug(i + ': Ignored (No Selection)')
        continue
      }

      const selection = selectionList[0]
      if (selection.innerText.indexOf('Unknown') >= 0) {
        logger.debug(i + ': Ignored (Responder set to Unknown)')
        continue
      }
      const callsign = this.extractCallsignFromTimelineElement(element)
      if (callsign) {
        responders.push(callsign)
      } else {
        logger.debug(i + ': Could not get Callsign')
      }
    }
    return responders.join(',')
  }

  countResponders () {
    const $ = this.$
    const logger = this.logger

    let count = 0
    const responderList = $('#ActiveRespondersPane').find('.scroller')[0].children
    logger.debug('Responder List Length is: ' + responderList.length)

    for (let i = 0; i < responderList.length; i++) {
      const element = responderList[i]
      const selectionList = $(element).find('.selection')
      if (selectionList.length === 0) {
        continue
      }

      const selection = selectionList[0]
      if (selection.innerText.indexOf('Unknown') >= 0) {
        continue
      }
      const callsign = this.extractCallsignFromTimelineElement(element)
      if (callsign) {
        count++
      }
    }
    return count
  }

  /// ////////////////////////////////////
  // PRFs / RHTs & METRO AMBO FORMS
  /// ////////////////////////////////////
  getPRFFormFields () {
    const container = this.getPRFContainer()
    return this.getFormFields(container, 'PRF')
  }

  getRHTFormFields () {
    const container = this.getRHTContainer()
    return this.getFormFields(container, 'RHT')
  }

  getMetroAmboFormFields () {
    const container = this.getMetroAmboContainer()
    return this.getFormFields(container, 'METRO')
  }

  getDODFormFields () {
    const container = this.getDODContainer()
    return this.getFormFields(container, 'DOD')
  }

  getFormFields (container, formType) {
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
      case 'DOD': {
        numberField = 'PRF Declaration Number'
        break
      }
    }

    if (container.length > 0) {
      for (let i = 0; i < container.length; i++) {
        if (container.find(`label:contains('${numberField}')`)[i].nextSibling.value.length > 0) {
          const prf = {}

          if (formType === 'DOD') {
            prf.formNumber = container.find(`label:contains('${numberField}')`)[i].nextSibling.value
            prf.triage = 'Blue'
            prf.outsourced = 'No'
            prf.usedDrugs = 'No' // No Drugs
            prfs.push(prf)
            continue
          }

          if (formType === 'RHT' || formType === 'PRF') {
            prf.formNumber =
              (formType === 'RHT' ? 'RHT' : '') +
              container.find(`label:contains('${numberField}')`)[i].nextSibling.value
          } else {
            prf.usedDrugs = 'No' // No Drugs
            prf.mistakes = 'No' // No Mistakes
            prf.firstCMVehicleOnScene = 'WCG Metro CM Ambulance' // Vehicle
            prf.formNumber = 'No PRF, Pt treated by WCG Metro CM Ambulance' // PRF Number
            prf.metroReference = container.find(`label:contains('${numberField}')`)[i].nextSibling.value
          }
          prf.triage = container.find("label:contains('Triage')")[i].nextSibling.value
          prf.gender = container.find("label:contains('Patient Gender')")[i].nextSibling.value
          prf.age = container.find("label:contains('Patient Age (Years)')")[i].nextSibling.value
          prf.ethnicGroup = container.find("label:contains('Patient Ethnic Group')")[i].nextSibling.value
          prf.outsourced = 'No'
          prfs.push(prf)
        }
      }
    }

    return prfs
  }

  /// ////////////////////////////////////
  // UTILS
  /// ////////////////////////////////////

  matchTimestampFromTimelineElement (name, timelineElement) {
    const TIME_PATTERN = /(\d{4}-\d{2}-\d{2})?\D+(\d{2}:\d{2})/g
    const innerText = timelineElement.innerText
    const match = TIME_PATTERN.exec(innerText)
    if (!match) {
      this.logger.debug('No ' + name + ' Time found: ' + innerText)
    }
    return match
  }

  extractTimeFromTimelineElement (name, timelineElement) {
    const match = this.matchTimestampFromTimelineElement(name, timelineElement)
    if (match) {
      this.logger.debug('Found ' + name + ' Time ' + match[2])
      return match[2]
    }
    return ''
  }

  extractDateFromTimelineElement (name, timelineElement) {
    const match = this.matchTimestampFromTimelineElement(name, timelineElement)
    if (match) {
      this.logger.debug('Found ' + name + ' Date ' + match[1])
      return match[1]
    }
    return ''
  }

  extractCallsignFromTimelineElement (timelineElement, includeRV) {
    const logger = this.logger

    const CALLSIGN_PATTERN = includeRV ? /([A-Z][A-Z]\d{2,3})(\D|$)/g : /([A-QS-Z][A-Z]\d{2,3})(\D|$)/g
    const innerText = timelineElement.innerText
    let match
    let callsign
    while ((match = CALLSIGN_PATTERN.exec(innerText)) !== null) {
      if ((includeRV && match[1].startsWith('RV')) || !includeRV) {
        logger.debug('Found callsign ' + match[1])
        return match[1]
      }

      if (!callsign) {
        logger.debug('Found callsign ' + match[1])
        callsign = match[1]
      }
    }

    if (!callsign) {
      logger.debug('No callsign found: ' + innerText)
    }

    return callsign
  }

  isCMCallsign (callsign, includeRV) {
    const CALLSIGN_PATTERN = includeRV ? /([A-Z][A-Z]\d{2,3})(\D|$)/g : /([A-QS-Z][A-Z]\d{2,3})(\D|$)/g
    return callsign.match(CALLSIGN_PATTERN)
  }

  extractVehicleCallsignFromTimelineElement (timelineElement) {
    const $ = this.$

    const callsignElements = $(timelineElement).find('div:has(div:has(i.fa-car))')
    if (callsignElements.length > 0) {
      const callsign = this.extractCallsignFromTimelineElement(callsignElements[0], true)
      if (callsign !== undefined) {
        return callsign
      }
    }
    return this.extractCallsignFromTimelineElement(timelineElement, true)
  }

  determineCallsignVehicle (callsign) {
    const firstTwoCharacters = callsign.substring(0, 2)
    if (
      firstTwoCharacters === 'RV' ||
      firstTwoCharacters === 'LC' ||
      firstTwoCharacters === 'VP' ||
      firstTwoCharacters === 'CS'
    ) {
      return callsign
    } else if (
      firstTwoCharacters === 'MR' ||
      firstTwoCharacters === 'FR' ||
      firstTwoCharacters === 'EF' ||
      firstTwoCharacters === 'CA' ||
      firstTwoCharacters === 'OM' ||
      firstTwoCharacters === 'DR' ||
      firstTwoCharacters === 'NR'
    ) {
      return 'Private Vehicle'
    }
    return ''
  }

  extractCallTypeFromElement (primaryTypeElement) {
    const CALLTYPE_PATTERN = /(.+)<span/g
    const htmlContent = primaryTypeElement.html()
    const match = CALLTYPE_PATTERN.exec(htmlContent)
    if (match) {
      const callType = this.unEntity(match[1])
      this.logger.debug('Found Call Type ' + callType)
      return callType
    } else if (htmlContent.indexOf('<') === -1) {
      const callType = this.unEntity(htmlContent)
      this.logger.debug('Found Call Type ' + callType)
      return callType
    } else {
      this.logger.debug('No Call Type Found: ' + htmlContent)
    }
    return ''
  }

  unEntity (str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }

  getPRFContainer () {
    return this.$('#ChecklistsContainer')
      .find('div[data-checklist-id]')
      .has("label:contains('PRF Number')")
      .has("label:contains('Triage')")
  }

  getRHTContainer () {
    return this.$('#ChecklistsContainer')
      .find('div[data-checklist-id]')
      .has("label:contains('RHT Number')")
      .has("label:contains('Triage')")
  }

  getMetroAmboContainer () {
    return this.$('#ChecklistsContainer')
      .find('div[data-checklist-id]')
      .has("label:contains('SLIP Number')")
      .has("label:contains('Triage')")
  }

  getDODContainer () {
    return this.$('#ChecklistsContainer')
      .find('div[data-checklist-id]')
      .has("label:contains('PRF Declaration Number')")
  }
}
