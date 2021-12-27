export default class {
  constructor (jquery, logger) {
    this.$ = jquery
    this.logger = logger.extend('loadTracker')
  }

  start () {
    this.checkAndHookIntoCloseButton()
  }

  closeHandler ({ $ = this.$, logger = this.logger }) {
    logger.debug('Close handler fired')
    const incidentNumber = $('#IncidentReference').html()
    const dispatcher = $('.profile-dropdown-toggle')
      .text()
      .trim()
    const serializedData = `action=close&IncidentNumber=${encodeURIComponent(
      incidentNumber
    )}&dispatcher=${encodeURIComponent(dispatcher)}`

    const url =
      'https://script.google.com/macros/s/AKfycbyr-ScTDersx1PD1rd5qcqy1_uJ7sZ_J_SLXwsd8HDbWXX9bZs/exec?' +
      serializedData +
      '&callback=?'

    $.getJSON(url)

    logger.debug('Google sheet has been notified of the Close')
  }

  checkAndHookIntoCloseButton ({
    $ = this.$,
    logger = this.logger,
    closeHandler = this.closeHandler,
    checkAndHookIntoCloseButton = this.checkAndHookIntoCloseButton
  } = {}) {
    if ($('#ToggleStatus[data-statusid=2]').length > 0) {
      logger.debug('Found Close Button')
      const hooked = $('#ToggleStatus').attr('hooked')
      if (!hooked) {
        logger.info('Adding Close Button Hook')
        $('#ToggleStatus').click(closeHandler)
        $('#ToggleStatus').attr('hooked', true)
      } else {
        logger.debug('Not adding close button, it seems to be added already')
      }
    } else {
      logger.debug("Close button doesn't exist")
    }

    setTimeout(() => checkAndHookIntoCloseButton({ $, logger, closeHandler, checkAndHookIntoCloseButton }), 1000)
  }
}
