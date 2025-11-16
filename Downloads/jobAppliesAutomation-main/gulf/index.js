import { startBrowser } from "../utils/browser.js";
import { sleep } from "../utils/common.js";
import { appendJsonData, getJsonData, saveJsonData } from "../utils/file.js";
const baseUrl = 'https://www.naukrigulf.com/'
const key = new Date().getTime()
// await page.waitForTimeout(2000)
// await page.click('button.ng-btn.jd-button.blue')

// https://www.naukrigulf.com/spapi/jobapi/userjobrecommendations/aggregated
const jobKeyWords = ['react', 'vue', 'frontend', 'backend', 'fullstack', 'javascript', 'html', 'css', 'python', 'golang', 'next', 'nuxt', 'node', 'express', 'django', 'fastapi', 'java', 'ruby', 'php', 'sql', 'mysql', 'mongodb', 'postgresql', 'mssql']
const getRecomondedList = async (page) => {
    await page.goto(baseUrl + 'jobseeker/recojobs', { timeout: 160000 })
    page.on('response', async (response) => {
        if (response.url().startsWith('https://www.naukrigulf.com/spapi/jobapi/userjobrecommendations/aggregated') && response.url().includes('tabs=all')) {
            const { recommendation } = await response.json(); // Assuming the response is JSON
            const joblist = recommendation.reduce((curr, elem) => {
                curr = [...curr, ...elem.jobs]
                return curr
            }, []).filter((e) => e.isEasyApply)
            let matchedJobDetails = {
                canApply: [],
                cannotApply: []
            }
            joblist.forEach((e) => {
                const keyStr = `${e.jobKeyWords} ${e.jobInfo} ${e.keywords} ${e.description} ${e.designation}`.toLocaleLowerCase()
                const matched = jobKeyWords.some((e) => keyStr.includes(e))
                if (matched) matchedJobDetails.canApply.push(e)
                else matchedJobDetails.cannotApply.push(e)
            })
            saveJsonData('gulf/recomanded/list', matchedJobDetails.canApply)
            appendJsonData('gulf/recomanded/rejected/list', matchedJobDetails.cannotApply)
        }
    })
}

const applyJobs = async (jobList, browser) => {
    let applyingJobs = jobList
    let currentJobIndex = 0
    let appliedList = []
    try {
        while (currentJobIndex < applyingJobs.length) {
            console.log(currentJobIndex + "/" + applyingJobs.length)
            const jobURL = applyingJobs[currentJobIndex].jdURL
            const page = await browser.newPage();
            await page.goto(baseUrl + jobURL);
            // await page.waitForTimeout(2000)
            await sleep(1000)
            console.log('here')
            const applyButton = await page.$('button.ng-btn.jd-button.blue')
            console.log(applyButton)
            if (applyButton) {
                appliedList.push(jobURL)
                applyButton.click()
            }
            await sleep(1000)

            const isTextPresent = await page.evaluate(() => {
                return document.body.innerText.includes("You have successfully applied") || document.body.innerText.includes("Already Applied");
            })
            if (isTextPresent) {
                await page.close()
            }
            currentJobIndex++
        }
    } catch (error) {

    } finally {

    }

}
const apply = async () => {
    const browser = await startBrowser()
    const page = await browser.newPage();
    page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await getRecomondedList(page)
    // saveJsonData("data/json/k",["1"])
    const jobLists = await getJsonData('gulf/recomanded/list')
    console.log(jobLists.length)
    applyJobs(jobLists, browser)
}

apply()