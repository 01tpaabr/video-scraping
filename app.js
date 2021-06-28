const pptr = require('puppeteer-core');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { input } = require('./readline_util.js');
const download = require("node-hls-downloader").download;
const configFilePath = "./config.json"
const config = require(configFilePath);


//Returns amount of videos downloaded to update config file
async function downloadYoutubeVideo(url, mode, count){
    try{
        if(mode === "audio"){
            await ytdl(url, { filter: 'audioonly' }).pipe(fs.createWriteStream(`./downloads/audio_${count}.mp3`));
        }else{
            await ytdl(url).pipe(fs.createWriteStream(`./downloads/yt-video_${count}.mp4`));
        }

        return 1;
    }catch(e){
        console.log("Error in youtube video download.");
        console.log(e);
    }
}

//Return amount of videos downloaded to update config file
//NEEDS FFMPEG (https://ffmpeg.org/)
async function downloadGenericVideo(url, count){
    try{
        await download({
            quality: "best",
            concurrency: 5,
            outputFile: `./downloads/g-video_${count}.mp4`,
            streamUrl: url
        });
    }catch(e){
        console.log("Error while downloading generic video.")
        console.log(e);
    }

    return count;
}

//Page obj, page url, and regex pattern to filter requests urls
//returns list of hlsURLs
async function getHLSRequests(page, url, pattern){
    let requests = [];

    await page.setRequestInterception(true);

    page.on('request', req => {
        req.continue();
    });

    page.on('response', response => {
        //intercepts m3u8 types
        if(response.url().match(pattern)){
            requests.push(response.url());
        }
    });

    //Waits to stop network traffic
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.setRequestInterception(false);

    return requests;
}

//Update JSON file
function updateVideoCount(filepath, file, newVideos){
    file.videoCount += parseInt(newVideos);
    fs.writeFile(filepath, JSON.stringify(file), function writeJSON (e){
        if(e) return console.log(e);
    });
}


//Main
(async () => {
    const browser = await pptr.launch({
        headless: config.headlessMode,
        executablePath: config.executablePath,
        userDataDir: config.userData,
        defaultViewport: { width: 1600, height: 800 }
    });

    const [page] = await browser.pages();

    let url = await input("Url:");

    //Intercepting HLS streams
    let hlsLinks = await getHLSRequests(page, url, /(m3u8)/);

    console.log("I've found out these links, choose one:");
    for (let i = 0;  i < hlsLinks.length; i++) {
        console.log(`${i+1}: ${hlsLinks[i]}`);
    }

    let chosenLink = parseInt(await input("Type the number of the link you want: "));
    while(chosenLink < 1 || chosenLink > hlsLinks.length){
        chosenLink = parseInt(await input("Choose an valid number: "));
    }

    console.log(config.videoCount);
    let amountOfNewVideos = await downloadGenericVideo(hlsLinks[chosenLink - 1], config.videoCount);
    console.log("New videos, " + amountOfNewVideos);

    await updateVideoCount(configFilePath, config, amountOfNewVideos);
    await browser.close();
})();