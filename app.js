const pptr = require('puppeteer-core');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { input } = require('./readline_util.js');
const { request } = require('http');
const configFilePath = "./config.json"
const config = require(configFilePath);

async function downloadYoutubeVideo(url, mode, count){
    try{
        if(mode === "audio"){
            await ytdl(url, { filter: 'audioonly' }).pipe(fs.createWriteStream(`./downloads/audio_${count}.mp3`));
        }else{
            await ytdl(url).pipe(fs.createWriteStream(`./downloads/video_${count}.mp4`));
        }
    }catch(e){
        console.log("Error in video download.");
        console.log(e);
    }
}

function updateVideoCount(filepath, file, newVideos){
    file.videoCount += newVideos;
    fs.writeFile(filepath, JSON.stringify(file), function writeJSON (e){
        if(e) return console.log(e);
    });
}

//Page obj, url and regex pattern to filter requests urls
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

    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.setRequestInterception(false);

    return requests;
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

    //Intercepting hls streams
    let requests = await getHLSRequests(page, url, /(m3u8)/);
    console.log(requests);

    // await page.setRequestInterception(true);

    // page.on('request', req => {
    //     req.continue();
    // });

    // page.on('response', response => {
    //     //intercepts m3u8 types
    //     let pattern = /(m3u8)/
    //     if(response.url().match(/(m3u8)/)){
    //         requests.push(response.url());
    //     }
    // });

    // await page.goto(url, { waitUntil: 'networkidle0' });

    // console.log(requests);

    //await page.goto(url);
    //Download video
    //await downloadYoutubeVideo(url, "audio", config.videoCount);
    //updateVideoCount(configFilePath, config, 1);
    //https://cursos.alura.com.br/course/certificacao-ccna-parte-1/task/26518
})();