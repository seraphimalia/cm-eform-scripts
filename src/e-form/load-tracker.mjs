import Scraper from './scraper.mjs'

export default class {
  constructor (jquery, logger) {
    this.$ = jquery
    this.scraper = new Scraper(jquery, logger)
    this.logger = logger.extend('loadTracker')
  }

  start () {
    this.waitForLoadAndPost()
  }

  postIncidentNumberWithUrl ($ = this.$, scraper = this.scraper) {
    const incidentNumber = $('#IncidentReference').text()
    const incidentDate = scraper.findIncidentDate() || scraper.incidentDateFromReference()
    const Url = window.location.href
    const createdPerson = $('.profile-dropdown-toggle')
      .text()
      .trim()

    const serializedData =
      `action=add&IncidentNumber=${encodeURIComponent(incidentNumber)}` +
      `&IncidentDate=${encodeURIComponent(incidentDate)}` +
      `&URL=${encodeURIComponent(Url)}` +
      `&CreatedPerson=${encodeURIComponent(createdPerson)}`

    const url =
      'https://script.google.com/macros/s/AKfycbyr-ScTDersx1PD1rd5qcqy1_uJ7sZ_J_SLXwsd8HDbWXX9bZs/exec?' +
      serializedData +
      '&callback=?'
    $.getJSON(url)
  }

  waitForLoadAndPost ({
    $ = this.$,
    postIncidentNumberWithUrl = this.postIncidentNumberWithUrl,
    waitForLoadAndPost = this.waitForLoadAndPost
  } = {}) {
    if ($('#ToggleStatus[data-statusid=2]').length > 0) {
      postIncidentNumberWithUrl()
    } else {
      setTimeout(() => waitForLoadAndPost({ $, postIncidentNumberWithUrl, waitForLoadAndPost }), 5000)
    }
  }
}
