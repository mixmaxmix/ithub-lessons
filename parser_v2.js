const fs = require('fs');
const {google} = require('googleapis');
const credentials = require("./gl keys/credentials.json");
const token = require('./gl keys/token.json');

async function authorize() {
    const {client_secret, client_id, redirect_uris} = credentials;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(token);

    return oAuth2Client;
}

(async function getAllLessons(){
    let auth = await authorize();
    const sheets = google.sheets({version: 'v4', auth});

    let properties = {
        spreadsheetId: '1e4WD0exf55EvrbHubpUl0bqfwq73oSWPKFD9XD5JXsU',
    };

    let writeArr = (arr) => {
        path = `/${arr.shift()}.json`;
        if(!fs.existsSync(path))
            fs.writeFileSync(path, JSON.stringify(arr));
    }

    async function getLessonsElems(list){
        properties.range = `'${list}'!A:A`

        processFunc = (res) =>{
            let resultArr = [list];

            res.splice(0,2);
            for(let i = 0; i < res.length; i+=7){
                let currentElem = res[i][0].replace(/^\s/, '').split(' ', 2);
                if(list == 'cabs') 
                    currentElem = currentElem.join(' ')
                else{
                    if(currentElem.length > 1)
                        if(!currentElem[1].includes('.')) currentElem.pop();
                    currentElem = currentElem.join(' ');
                }


                if(!resultArr.includes(currentElem)) resultArr.push(currentElem);
            }

            return resultArr;
        }

        return new Promise((resolve, reject) => {
            sheets.spreadsheets.values.get(properties, (err, res) => {
                if (err) reject(err);
                else resolve(processFunc(res.data.values));
            })
        })
    }
    let teachers = await getLessonsElems('teachers');
    // teachers.shift();
    // writeArr(teachers)

    let groupes = await getLessonsElems('groupes');
    
    let cabs = await getLessonsElems('cabs');
    cabs.shift();
    // writeArr(groupes);
    
    async function getLessons(list) {
        properties.range = `'${list}'!A3:P359`;
    
        let processFunc = (res) => {
            let group = res[0][0]; 
            let week = {'понедельник':[], 'вторник':[], 'среда':[], 'четверг':[], 'пятница':[], 'суббота': []};
            let weekKeys = Object.keys(week);
            
            let count = 0;
            for(let i = 0; i < res.length; i++){

                let currentRow = res[i];

                count++;
                if(count > 7){
                    if(!group.includes('ОН')) fs.writeFileSync(`weeks/${group}_week.json`, JSON.stringify(week));
                    week = {'понедельник':[], 'вторник':[], 'среда':[], 'четверг':[], 'пятница':[], 'суббота': []};
                    count = 1;
                    group = currentRow[0];
                }
                
                if(group.includes('ОН')) continue
                
                function parseRow(startIndex){
                    let lessonRow = [];
                    for(let j = startIndex; j < (startIndex + weekKeys.length); j++){
                        let currentCell = currentRow[j]; 
                        
                        function parseCell(cell){
                            let lesson;
                            if(cell){
                                lesson = {};
                                cell = cell.replace(/\s+/g, ' ').trim();
                                for(groupForReplace of groupes){
                                    cell = cell.replace(new RegExp(`\\s*${[].map.call(groupForReplace, (letter) => (letter === '+' ? '\\' + letter + '\\s*' : letter + '\\s*')).join('')}`, 'gi'), ' _g_ ');
                                }
                                
                                // определение учителя
                                for(teacher of teachers){
                                    let [surname, initials] = teacher.split(' ');
                                    let surnameIsRepeated = 0;
                                    teachers.forEach(elem => {if(elem.includes(surname)) surnameIsRepeated++});
                                    if(surnameIsRepeated == 1){
                                        initials = undefined;
                                        teacher = surname
                                    }
                            
                                    if(initials){
                                        let surnameRegExp = new RegExp([].map.call(surname, (letter) => (letter + '.?')).join(''), 'i');
                                        if(cell.match(surnameRegExp)){
                                            let letter1 = initials.split('.')[0];
                                            let splitedStr = cell.split(' ');
                                            
                                            if(splitedStr[splitedStr.indexOf(cell.match(surnameRegExp)[0]) + 1].includes(letter1)){
                                                cell = cell.replace(new RegExp(`${surnameRegExp}\\s*${letter1}?\\.?`), ' _t_ ');
                                                lesson.teacher = teacher;
                                                break
                                            }
                                        }
                                    }else{
                                        let teacherRegExp = new RegExp([].map.call(teacher, (letter) => (letter + '.?')).join(''), 'i');
                                        if(cell.match(teacherRegExp)){
                                            cell = cell.replace(teacherRegExp, ' _t_ ');
                                            lesson.teacher = teacher;
                                            break
                                        }
                                    }
                                }
                                let foundedAuds = [];
                                for(cab of cabs){
                                    let [part1, part2] = cab.split(' ');
                                    let cellCabs = cell.match(new RegExp((part2 === 'кабинет') ? `${part1}\\s*${[].map.call(part2, (letter) => (letter + '?')).join('')}` : `${part1}\\s*${part2}`,'gi'));
                                    if(cellCabs){
                                        for(cellCab of cellCabs) cell = cell.replace(cellCab, ' _c_ ')
                                        
                                        foundedAuds.push(cab);
                                    }
                                }
                                lesson.aud = foundedAuds.join('/').trim();
                        
                                let titleEndIndex = cell.search(/_[tgc]_/i);
                                lesson.title = cell.slice(0, titleEndIndex).trim();
                        
                                while(!lesson.title || lesson.title.length < 3){
                                    cell = cell.replace(/_[tgc]_/i, '');
                                    
                                    titleEndIndex = cell.search(/_[tgc]_/i);
                                    lesson.title = cell.slice(0, titleEndIndex).trim();
                                    if(titleEndIndex = -1) break
                                }
                            }
                            return lesson
                        }

                        let lessonToCollect;
                        if(currentCell){
                            lessonToCollect = {};
                            if(currentCell.match(/\s*\+\s*/g)){
                                let splittedCell = currentCell.split(/\s*\+\s*/g);
                                for(piece of splittedCell){
                                    let processedPiece = parseCell(piece);
                                    if(processedPiece.title){    
                                        if(!processedPiece.title.match(/^\s*$/)){
                                            lessonToCollect.title = processedPiece.title;
                                        }
                                    }
                                    for(prop of Object.keys(processedPiece)){
                                        if(prop !== 'title'){
                                            if(!lessonToCollect[prop]) 
                                                lessonToCollect[prop] = `${processedPiece[prop] ? processedPiece[prop] : ''}/`;
                                            else
                                                lessonToCollect[prop] += `${processedPiece[prop] ? processedPiece[prop] : ''}/`;    
                                        }
                                    }
                                }
                            }else{
                                lessonToCollect = parseCell(currentCell);
                            }

                            if(!lessonToCollect.aud || lessonToCollect.aud.match(/^\s*$/)) lessonToCollect.place = 'Онлайн'
                            else if(lessonToCollect.aud.includes('кабинет')) lessonToCollect.place = 'Курская';
                            else lessonToCollect.place = 'ВДНХ';
                        }
                        lessonRow.push(lessonToCollect);
                    }
                    return lessonRow
                }

                let redRow = parseRow(2);
                let blueRow = parseRow(9);

                for(let i = 0; i < weekKeys.length; i++){
                    let lesson = {count: count};
                    if(redRow[i]) lesson.RED = redRow[i];
                    if(blueRow[i]) lesson.BLUE = blueRow[i];

                    if(lesson.RED && lesson.BLUE){
                        let colorsIsSimilar = true;
                        for(let j = 0; j < Object.keys(lesson.RED).length; j++){
                            if(lesson[Object.keys(lesson.RED)[j]] != lesson[Object.keys(lesson.BLUE)[j]]){
                                colorsIsSimilar = false;
                                break
                            }
                        }

                        if(colorsIsSimilar){
                            delete lesson.BLUE;
                            temp = {...lesson.RED};
                            delete lesson.RED;

                            lesson = Object.assign(lesson, temp)
                        }
                    }
                    
                    if(lesson.RED || lesson.BLUE || lesson.title) week[weekKeys[i]].push(lesson);
                }
            }
        }
        sheets.spreadsheets.values.get(properties, (err, res) => {
            if (err) console.log(err);
            else processFunc(res.data.values);
        })
    }

     getLessons('groupes');
})()