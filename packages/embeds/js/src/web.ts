import { registerWebComponents } from './register'
import { parseProbot, injectProbotInWindow } from './window'

registerWebComponents()

const probot = parseProbot()

injectProbotInWindow(probot)

export default probot
