const fs = require('fs');
const {google} = require('googleapis');
const credentials = require("./gl keys/credentials.json");
const token = require('./gl keys/token.json');
const groupes = require('./groupes.json');

const FILE_PATH = './PWA_site_proto/week.js';
let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

let doubleLetters = [];
for(let j = 0; j < letters.length; j++){
    for(let n = 0; n < letters.length; n++)
        doubleLetters.push(`${letters[j]}${letters[n]}`);
}

letters = letters.concat(doubleLetters);



authorize();

async function authorize() {
    const {client_secret, client_id, redirect_uris} = credentials;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(token);

    return oAuth2Client;
}

async function getLessons(startLetter, endLetter) {
    let auth = await authorize();
    const sheets = google.sheets({version: 'v4', auth});
    let properties = {
        spreadsheetId: '1uebUDAixmx3RHUtxbMD2mEB96DxdaZBlpDFf5IZQBfQ',
        range: `${startLetter}5:${endLetter}71`
    };

    let getWeek = (res) => {
        createLesson = (aud, place, title, teacher, count = 0) =>({
            title: title,
            aud:aud,
            place: place,
            count:count,
            teacher: teacher,
        })
        let week = {'понедельник':[], 'вторник':[], 'среда':[], 'четверг':[], 'пятница':[]}
        let weekKeys = Object.keys(week);
        
        let results = res.data.values;
        
        
        let j = 0;
        let count = 1;
        for(let i = 0; i < weekKeys.length; i++){
            
            for(; j < results.length; j+=2){
                if(count > 7){
                    count = 1;
                    break;
                }else{
                    if(!results[j+1]) break
                    week[weekKeys[i]].push(createLesson(results[j+1][1], results[j][1], results[j][0], results[j+1][0], count));
                    count++;
                }
            }
        }
        for(i = 0; i < weekKeys.length; i++){
            let currentLessons = [];
            for(j = 0; j < week[weekKeys[i]].length; j++){
                if(week[weekKeys[i]][j].title){
                    currentLessons.push(week[weekKeys[i]][j]);
                } 
            }
            week[weekKeys[i]] = currentLessons;
        }
        return week;
    }

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.get(properties, (err, res) => {
            if (err) reject(err)
            else resolve(getWeek(res));
        });
    });
}

for(let i = 4; i < groupes.length*2+4; i+=2){
    let currentGroupe = groupes[(i-4)/2]
    getLessons(letters[i], letters[i+1], currentGroupe)
    .then(result => {
        fs.writeFileSync(`PWA_site_proto/sourses/${currentGroupe}_week.json`, JSON.stringify(result));
        // console.log(result);
    })
    .catch(console.log);
}

function getGroupes(auth){
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
        spreadsheetId: '1uebUDAixmx3RHUtxbMD2mEB96DxdaZBlpDFf5IZQBfQ',
        range: `E4:CX4`
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        let [results] = res.data.values;
        let groupes = [];
        
        for(let i = 0; i < results.length; i++){
            console.log(!(results[i].includes('Ауд')));
            if(!(results[i].includes('Ауд'))){
                groupes.push(results[i]);
            }      
        }
        // console.log(groupes);
        fs.writeFileSync('groupes.json', `${JSON.stringify(groupes)}`);
    })
}

