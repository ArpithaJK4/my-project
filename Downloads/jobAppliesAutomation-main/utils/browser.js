import path from 'path';
import puppeteer from 'puppeteer';

const startBrowser = async() => {
    const userDataDir = path.join(process.env.BROWSER_PATH, `${process.env.EMAIL.split('@')[0]}`);
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-infobars', 
            '--disable-extensions', 
            '--start-maximized', 
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',  // Disable web security
            '--disable-features=IsolateOrigins,site-per-process',  // Disable site isolation
          ],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: userDataDir
    });

    return browser
}

export {
    startBrowser
}
