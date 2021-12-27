export default class Logger {
  constructor (prefix) {
    this.prefix = prefix
  }

  extend (module) {
    return new Logger(`${this.prefix}-${module}`)
  }

  debug (msg, ...metadata) {
    console.debug(`${this.prefix}: ${msg}`, ...metadata)
  }

  info (msg, ...metadata) {
    console.info(`${this.prefix}: ${msg}`, ...metadata)
  }

  warn (msg, ...metadata) {
    console.warn(`${this.prefix}: ${msg}`, ...metadata)
  }

  error (msg, ...metadata) {
    console.error(`${this.prefix}: ${msg}`, ...metadata)
  }
}
