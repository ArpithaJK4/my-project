
import path from 'path';
import * as fs from 'fs'
const formatedJSONPath = (pathloc='fake') => {
    let filePath = pathloc
    if(!filePath.endsWith('.json')){
        filePath = `${filePath}.json`
    }
    return `data/${filePath}`
}
const saveJsonData = async(pathloc, data) => {
    // Create the directory if it doesn't exist
    const filePath = formatedJSONPath(pathloc)
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write the JSON data to the file
    await fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
const getJsonData = async (pathloc,data) => {
    let existingData = [];
    const filePath = formatedJSONPath(pathloc)
    
    // Check if the file exists, and if so, read its contents
    if (fs.existsSync(filePath)) {
        const rawData = await fs.readFileSync(filePath);
        if(typeof rawData == 'object') existingData = JSON.parse(rawData);
    }
    return existingData || []
}
const appendJsonData = async (pathloc,data) => {
    let existingData = await getJsonData(pathloc,data)
    // Append new data to the existing data
    const updatedData = [...existingData,...data];
    await saveJsonData(pathloc,updatedData)
}

export {
    saveJsonData,
    appendJsonData,
    getJsonData
}