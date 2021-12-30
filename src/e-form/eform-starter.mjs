import Scraper from './scraper.mjs'
import Logic from './logic.mjs'
import Mapper from './mapper.mjs'

const ACCOUNT_CHOOSER_PREFIX = 'https://www.google.com/accounts/AccountChooser?Email=&continue='
const BASE_EFORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfpAaoTFKcq5z_w8L13Y2Diklb20HuT9c5HKZMhD7GJu4VPWQ/viewform'

export default class EformStarter {
  constructor (jquery, logger) {
    this.$ = jquery
    this.logger = logger.extend('eFormStarter')
    this.scraper = new Scraper(jquery, logger)
    this.logic = new Logic(logger)
    this.mapper = new Mapper()
  }

  start () {
    this.addEFormButton()
  }

  addEFormButton ({
    $ = this.$,
    addEFormButton = this.addEFormButton,
    doubleCheckEformButtonExists = this.doubleCheckEformButtonExists,
    logger = this.logger
  } = {}) {
    if ($('#ToggleStatus[data-statusid=1]').length > 0) {
      $('#ActiveOrderMenu').append(() =>
        $('<span id="StartEformMenu"><a class="btn btn-xs btn-default" id="BuildEForm">Start eForm</a></span>').click(
          () => {
            const eFormStarter = new EformStarter($, logger)
            eFormStarter.buildEForm()
          }
        )
      )
      if ($('#BuildEForm').length === 0) {
        logger.debug('EForm Button Not Added, Trying again Later!')
        setTimeout(() => addEFormButton({ $, addEFormButton, doubleCheckEformButtonExists, logger }), 5000)
      } else {
        logger.info('EForm Button Added')
        setTimeout(
          () => doubleCheckEformButtonExists({ $, addEFormButton, doubleCheckEformButtonExists, logger }),
          10000
        )
      }
    } else {
      logger.debug('Incident not closed, Checking again Later!')
      setTimeout(() => addEFormButton({ $, addEFormButton, doubleCheckEformButtonExists, logger }), 5000)
    }
  }

  doubleCheckEformButtonExists ({
    $ = this.$,
    addEFormButton = this.addEFormButton,
    doubleCheckEformButtonExists = this.doubleCheckEformButtonExists,
    logger = this.logger
  } = {}) {
    if ($('#BuildEForm').length === 0) {
      logger.debug('DOUBLECHECK EForm Button Does Not Exist, Running Add Button Procedure!')
      setTimeout(() => addEFormButton({ $, addEFormButton, doubleCheckEformButtonExists, logger }), 5000)
    } else {
      logger.debug('DOUBLECHECK EForm Button Exists')
      setTimeout(() => doubleCheckEformButtonExists({ $, addEFormButton, doubleCheckEformButtonExists, logger }), 10000)
    }
  }

  buildEForm () {
    const incidentDescription = this.scraper.getIncidentDescription().toLowerCase()
    if (incidentDescription.indexOf('backlog') >= 0) {
      try {
        this.buildEFormContinue(true)
      } catch (error) {
        this.logger.error('Error Building eForm', error)
      }
    } else {
      this.ConfirmDialog('Is this a backlogged incident?')
        .then(isBacklogged => this.buildEFormContinue(isBacklogged))
        .catch(error => this.logger.error('Error Building eForm', error))
    }
  }

  buildEFormContinue (isBacklogged) {
    const eFormData = this.collectEformData(isBacklogged)
    this.logger.debug('WE ARE HERE!', eFormData)
    for (let i = 0; i < eFormData.length; i++) {
      const perFormData = eFormData[i]
      const eFormUrl = this.buildEformUrl(perFormData)

      this.logger.debug('Opening eForm with URL', eFormUrl)
      window.open(eFormUrl)
    }
  }

  collectEformData (isBacklogged) {
    const eFormData = []

    const commonIncidentFields = this.getCommonIncidentFields(isBacklogged)
    this.logger.debug('Common Fields', commonIncidentFields)

    const uploadedForms = this.getUploadedFormFields()
    this.logger.debug('Uploaded Forms', uploadedForms)

    if (uploadedForms.length > 0) {
      commonIncidentFields.outsourced = 'No'
      commonIncidentFields.cmArrived = 'Yes'
      commonIncidentFields.treatedPatient = 'Yes, there is a Form uploaded'
    }

    for (let i = 0; i < uploadedForms.length; i++) {
      const formData = {
        ...commonIncidentFields,
        ...uploadedForms[i]
      }
      eFormData.push(formData)
    }

    return eFormData
  }

  buildEformUrl (perFormData) {
    const mapper = this.mapper
    const queryString = Object.keys(perFormData)
      .map(function (key) {
        return mapper.getFormIdFromPropertyName(key) + '=' + encodeURIComponent(perFormData[key])
      })
      .join('&')

    const encodedEformUrl = encodeURIComponent(`${BASE_EFORM_URL}?${queryString}`)
    return `${ACCOUNT_CHOOSER_PREFIX}${encodedEformUrl}`
  }

  getCommonIncidentFields (isBacklogged, { scraper = this.scraper, logic = this.logic } = {}) {
    const coordinates = scraper.getLocationCoordinates()

    const commonIncidentFields = {
      incidentLink: scraper.getIncidentLink(),
      callSource: scraper.getCallSource(),
      division: logic.detectDivision(coordinates),
      incidentNumber: scraper.getIncidentNumber(),
      incidentDate: scraper.findIncidentDate(),
      incidentTime: scraper.findIncidentTime(),
      pagedTime: scraper.findPagedTime(isBacklogged),
      callType: scraper.getCallType(),
      priority: scraper.getPriority(),
      address: scraper.getLocationAddress(),
      coordinates
    }

    // response
    const responseFields = {
      firstCMVehicleOnScene: scraper.getFirstCMVehicleOnScene(),
      responderCallsigns: '', // TEMPORARILY DISABLED because of RD bug that marks all responders departed when closing a call, was: scraper.getResponderCallsigns(),
      outsourced: scraper.getFirstCMVehicleOnScene() ? 'No' : '' // TEMPORARILY CHANGED because of RD bug that marks all responders departed when closing a call, was: scraper.countResponders() > 0 || scraper.getFirstCMVehicleOnScene() ? 'No' : 'Yes'
    }

    return {
      ...commonIncidentFields,
      ...responseFields
    }
  }

  getUploadedFormFields () {
    const uploadedFormFields = []

    const scraper = this.scraper
    const prfs = scraper.getPRFFormFields()
    for (let i = 0; i < prfs.length; i++) {
      uploadedFormFields.push(prfs[i])
    }

    const rhts = scraper.getRHTFormFields()
    for (let i = 0; i < rhts.length; i++) {
      uploadedFormFields.push(rhts[i])
    }

    const metroPts = scraper.getMetroAmboFormFields()
    for (let i = 0; i < metroPts.length; i++) {
      uploadedFormFields.push(metroPts[i])
    }

    const dods = scraper.getDODFormFields()
    for (let i = 0; i < dods.length; i++) {
      uploadedFormFields.push(dods[i])
    }

    return uploadedFormFields
  }

  /// ///////////////////////////////////////
  // UTILS
  /// ///////////////////////////////////////

  ConfirmDialog (message) {
    return new Promise((resolve, reject) => {
      const $ = this.$
      const destroyEformDialog = this.destroyEformDialog
      this.appendEformDialog(message)
      $('#eFormDialogYes').click(() => {
        destroyEformDialog({ $ })
        resolve(true)
      })
      $('#eFormDialogNo').click(() => {
        destroyEformDialog({ $ })
        resolve(false)
      })

      this.showEformDialog()
    })
  }

  showEformDialog () {
    this.$('#eFormYesNoDialog').show()
  }

  destroyEformDialog ({ $ = this.$ } = {}) {
    $('#eFormYesNoDialog').remove()
  }

  appendEformDialog (message) {
    this.$(
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
}
