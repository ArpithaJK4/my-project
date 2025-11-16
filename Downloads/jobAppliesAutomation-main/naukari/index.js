import { startBrowser } from "../utils/browser.js";
import { sleep } from "../utils/common.js";
import { appendJsonData, getJsonData, saveJsonData } from "../utils/file.js";
const baseUrl = 'https://www.naukri.com/'
const jobKeyWords = ['react', 'vue', 'frontend', 'backend', 'fullstack', 'javascript', 'html', 'css', 'python', 'golang', 'next', 'nuxt', 'node', 'express', 'django', 'fastapi', 'java', 'ruby', 'php', 'sql', 'mysql', 'mongodb', 'postgresql', 'mssql']
const filterJobList = (list) => {
    const rejectedJoblist = []
    const jobList = list.reduce((acc, detail) => {
        const data = { ...detail };
        const keyStr = `${data.jobDescription} ${data.tagsAndSkills}`.toLocaleLowerCase()
        const jobMatch = jobKeyWords.some((e) => keyStr.includes(e));

        if (jobMatch) {
            acc.push({
                jobId: data.jobId,
                companyName: data.companyName,
                jdURL: data.jdURL,
                jobDescription: data.jobDescription,
                jobMatch: jobMatch
            });
        } else {
            console.log(keyStr)
            rejectedJoblist.push(detail)
        }

        return acc;
    }, [])
    return {
        canApply: jobList,
        cannotApply: rejectedJoblist
    }
}


const applyJobs = async (jobList, browser) => {
    let applyingJobs = jobList
    let currentJobIndex = 0
    let appliedList = []
    try {
        while (currentJobIndex < applyingJobs.length) {
            console.log(currentJobIndex + "/" + applyingJobs.length)
            const jobURL = applyingJobs[currentJobIndex].jdURL
            const jobId = applyingJobs[currentJobIndex].jobId
            const page = await browser.newPage();
            await page.goto('https://www.naukri.com' + jobURL);
            await sleep(1000)
            const applyButton = await page.$('#apply-button')
            if (applyButton) {

                appliedList.push(jobURL)
                applyButton.click()
                await sleep(5000)
                page.on('response', async (response) => {
                    if (response.url().startsWith(`https://www.naukri.com/jobapi/v1/search/simjobs/${jobId}`)) {
                        const data = await response.json(); // Assuming the response is JSON
                        const jobDetails = data?.jobDetails || []
                        const matchedJobDetails = filterJobList(jobDetails)
                        applyingJobs.push(matchedJobDetails.canApply)
                        await saveJsonData('naukari/recomanded/list' + currentJobIndex, matchedJobDetails.canApply)
                        await saveJsonData('naukari/recomanded/rejected/list' + currentJobIndex, matchedJobDetails.cannotApply)
                    }
                });
                await sleep(5000)
            }
            currentJobIndex++
        }
    } catch (error) {
        console.log(error)
    } finally {
        // appendJsonData('naukari/recomanded/applied', appliedList)
        // appendJsonData('naukari/recomanded/toApply', applyingJobs.slice(currentJobIndex))
    }
}

const getRecomondedList = async (page) => {
    await page.goto(baseUrl + 'mnjuser/recommendedjobs', { timeout: 160000 })
    const mightLike = await page.$('#similar_jobs')
    // if (mightLike) {
    //     mightLike.click()
        page.on('response', async (response) => {
            if (response.url().startsWith('https://www.naukri.com/jobapi/v2/search/recom-jobs')) {
                const data = await response.json(); // Assuming the response is JSON
                const jobDetails = data?.jobDetails || []
                const matchedJobDetails = filterJobList(jobDetails)
                await saveJsonData('naukari/recomanded/list', matchedJobDetails.canApply)
                await appendJsonData('naukari/recomanded/rejected/list', matchedJobDetails.cannotApply)
            }
        });
    // {
    //     console.log('not found')
    // }
    return
}
const apply = async () => {
    const browser = await startBrowser()
    const page = await browser.newPage();
    page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await getRecomondedList(page)
    const jobLists = await getJsonData('naukari/recomanded/list')
    applyJobs(jobLists, browser)
    // saveJsonData("data/json/k",["1"])
}

apply()