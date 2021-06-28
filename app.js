const pptr = require('puppeteer-core');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { input } = require('./readline_util.js')
const configFilePath = "./config.json"
const config = require(configFilePath);

async function launchBrowser(profileMode){
    try{
        if(profileMode){
            //Needs chrome process to be closed before launching
            return await pptr.launch({
                headless: config.headlessMode,
                executablePath: config.executablePath,
                userDataDir: config.userData
            });

        }else{
            return await pptr.launch({headless: config.headlessMode});
        }
    }catch(e){
        console.log("Error while launching browser");
        console.log(e);
    }
}

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

if(config.profileMode && (config.userData === "" || config.userDataDir === "")){
    console.log("Please fill in user data");
}

//Main
(async () => {
    const browser = await launchBrowser(config.profileMode);
    const [page] = await browser.pages();

    let url = await input("Url do video: ");
    await page.goto(url);
    
    //Download video
    await downloadYoutubeVideo(url, "audio", config.videoCount);
    config.videoCount += 1;

    //Update video Count in json file
    fs.writeFile(configFilePath, JSON.stringify(config), function writeJSON (e){
        if(e) return console.log(e);
    });
    
})();