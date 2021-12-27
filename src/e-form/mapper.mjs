export default class {
  constructor () {
    this.propertyMap = {
      // INCIDENT DETAILS
      incidentLink: '1135306597',
      callSource: '2106635580',
      division: '463530578',
      incidentNumber: '1924809922',
      incidentDate: '114098279',
      incidentTime: '1217303619',
      pagedTime: '1832005076',
      callType: '878902615',
      priority: '1497115840',
      address: '1274427282',
      coordinates: '2018858849',

      // RESPONSE DETAILS
      firstCMVehicleOnScene: '1053983549',
      responderCallsigns: '1290512630',
      outsourced: '20964047',
      cmArrived: '1212629664',
      treatedPatient: '11285432',

      // FORM DETAILS
      formNumber: '317060543',
      usedDrugs: '570272751',
      mistakes: '119034859',
      triage: '51345540',
      gender: '1050026024',
      age: '1997410564',
      ethnicGroup: '1098331734'
    }
  }

  getFormIdFromPropertyName (propertyName) {
    if (this.propertyMap[propertyName]) {
      return `entry.${this.propertyMap[propertyName]}`
    }
    return 'unknownProperty'
  }
}
