import { applyRecommandedJobs } from "./naukari/recommandation/index.js";
import { startBrowser } from "./utils/browser.js";
console.log(process.env)

startBrowser()
applyRecommandedJobs()