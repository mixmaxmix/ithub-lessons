function getRnd(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; // максимум и минимум включаются
}

// week - объект, где ключи - дни недели, а значения - массивы с парами, сгенерирован автоматически на основе таблицы с расписанием
// groupes - массив с группами

const DAYS = ['понедельник', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'понедельник'];
const NOW = new Date(Date.now());
const TRUE_NOW = new Date(NOW); // копируем объект NOW, потому что потом для NOW изменяется время. Не использую везде просто Date.now(), потому что потом будем дату присылать с сервера возможно
const START_TIMES = [NOW.setHours(10, 0), NOW.setHours(11, 40), NOW.setHours(14, 0), NOW.setHours(15, 40), NOW.setHours(17, 20), NOW.setHours(19, 0), NOW.setHours(20, 40)]; // времена начала пар
const DURATION = 400;

// цвета
const BLUE = '#5577D7';
const RED = '#FF5157';
const LGREY = '#F4F6F7';
const BLACK = '#313131';
const WHITE = '#FFFFFF';
const MAIN_COLOR = '#FABC58';

function getCurentWeekColor(){
    let dateToProcess = new Date(NOW.setHours(0,0,0));
    let currentYear = new Date(NOW.getFullYear(), 0, 1);

    dateToProcess.setDate(NOW.getDate() + 4 - (NOW.getDay()||7));
    
    let currentWeerColor = (Math.floor(((dateToProcess - currentYear) / 1000 / 60 /60 / 24 + 1) / 7) % 2) === 0 ? RED : BLUE;
    if(NOW.getDay() == 6 || NOW.getDay() == 0){
        currentWeerColor = currentWeerColor === RED ? BLUE : RED;
    }
    
    return currentWeerColor;
}

// функция, которая загружает весь интерфейс расписания
function loadAll(groupeName){
    function loadDay(dayCount, groupe) {
        let currentDay = week[groupe][DAYS[dayCount]];
    
        let dayBlock = document.createElement('div');
        dayBlock.innerHTML = `
            <h3 class="lessons__title"></h3>
            <div class="lessons__content"></div>`;
        dayBlock.className = 'lessons'
    
        // изменение заголоква lessons__title
        let dayDesc;
        let betweenNowAndSelected = NOW.getDay() == 6 ? dayCount + 1 : NOW.getDay() == 0 ? dayCount : dayCount - NOW.getDay();
    
        dayDesc =
            betweenNowAndSelected === undefined ? 'Когда-то' :
            betweenNowAndSelected === -3 || betweenNowAndSelected === -4 ? `${NOW.getDay() - dayCount} дня назад` :
            betweenNowAndSelected === -2 ? 'Позавчера' :
            betweenNowAndSelected === -1 ? 'Вчера' :
            betweenNowAndSelected === 0 ? 'Сегодня' :
            betweenNowAndSelected === 1 ? 'Завтра' :
            betweenNowAndSelected === 2 ? 'Послезавтра' :
            betweenNowAndSelected === 3 || betweenNowAndSelected === 4 ? `Через ${betweenNowAndSelected} дня` :
            `Через ${betweenNowAndSelected} дней`;
        
    
        dayBlock.querySelector('.lessons__title').innerHTML = dayDesc + ',&nbsp' + `<b> ${DAYS[dayCount]}</b>, ${currentDay.length + `${currentDay.length == 0 ? ' пар' : currentDay.length == 1 ? ' пара' : ' пары'}`}`;
    
        // заполнение расписанием - создание карточек с парами
        for (let i = 0; i < currentDay.length; i++) {
            let currentLesson = currentDay[i];
    
            // определение шаблона карточки
            let lessonCard = document.createElement('div');
            lessonCard.className = 'lesson';
            lessonCard.id = `l${currentLesson.count}`;
            lessonCard.innerHTML = `
            <div class="lesson__time-cont"><span class="lesson__time"></span><span class="lesson__time"></span></div>
            <div class="lesson__content">
                <h4 class="lesson__title"></h4>
                <span class="lesson__aud"></span>
            </div>
            <div class="lesson__arrow"></div>
            <div class="lesson__line"></div>`;
    
            // время
            let times = lessonCard.querySelectorAll('.lesson__time');
            let startTime = new Date(START_TIMES[currentLesson.count - 1]);
            let endTime = new Date(+startTime + 90 * 6e4);
    
            times[0].innerText = `${startTime.getHours()}:${startTime.getMinutes() / 10 === 0 ? `0${startTime.getMinutes()}` : startTime.getMinutes()} `;
            times[1].innerText = `${endTime.getHours()}:${endTime.getMinutes() / 10 === 0 ? `0${endTime.getMinutes()}` : endTime.getMinutes()} `;
    
            // происходит простое добавление карточки в расписание
            dayBlock.querySelector('.lessons__content').append(lessonCard);
    
            // линия после каждого элемента
            
    
            //  создание обеда после второй пары
            if(currentLesson.count === 2 && currentDay[i + 1]) {
                let dinner = document.createElement('div');
                dinner.innerHTML = `<div class="lesson__time-cont"></div>
                <div class="lesson__content">
                    <h4 class="lesson__title">Обед</h4>
                </div>
                <div class="lesson__line"></div>`;
                dinner.classList.add(lessonCard.className, 'lessons_diner');
                dinner.id = 'dinner';
    
                // время обеда
                let dinnerTime = (START_TIMES[currentDay[i + 1].count - 1] - endTime) / (60*1000);
                dinner.querySelector('.lesson__time-cont').innerHTML = dinnerTime >= 60 ?`${dinnerTime / 60} ч.` : `${dinnerTime} м.`;
    
                dayBlock.querySelector('.lessons__content').append(dinner);
            }
    
            // название предмета
            lessonCard.querySelector('.lesson__title').innerText = currentLesson.title;
    
            // аудитория
            lessonCard.querySelector('.lesson__aud').innerText = currentLesson.place === 'ОНЛ' ? currentLesson.place :
                currentLesson.place === 'Кур' ? `${currentLesson.place} ${currentLesson.aud}` : currentLesson.aud ? currentLesson.aud : currentLesson.place;
    
            // плашка с дополнительной инфой
            let info = document.createElement('div');
            info.className = 'lesson-info';
            info.id = `info${lessonCard.id}`;
            info.innerHTML = `
            <div class="lesson-info__content">
                <span class="lesson-info__title"></span>
                <span class="lesson-info__count lesson-info_txt"></span>
                <span class="lesson-info__aud lesson-info_txt"></span>
                <span class="lesson-info__teacher lesson-info_txt"></span>
            </div>`;
    
            info.querySelector('.lesson-info__title').innerText = currentLesson.title;
            info.querySelector('.lesson-info__count').innerText = `${currentLesson.count}-${currentLesson.count === 3 ? 'я' : 'ая'} пара `;
            info.querySelector('.lesson-info__aud').innerText = 'Аудитория: ' + currentLesson.place + ' ' + (currentLesson.aud ? currentLesson.aud : '');
            info.querySelector('.lesson-info__teacher').innerText = 'Преподаватель: ' + currentLesson.teacher;
    
            // инфо создается на весь экран и при нажатии на него происходит remove
            let infoContent = info.lastChild;
    
            lessonCard.onclick = () => {
                document.body.append(info);
                infoContent.classList.add('lesson-info__active');
                info.classList.add('lesson-info__activeBg');
                
                for(infoContentElem of infoContent.querySelectorAll('.lesson-info_txt')){
                    infoContentElem.classList.add('lesson-info__innerActive');
                    infoContentElem.addEventListener('animationend', () => {infoContentElem.style.marginBottom = '0px'})
                }
            }
    
            info.onanimationend = () => {
                info.onclick = () => {
                    infoContent.style.bottom = '-40vh';
                    info.style.opacity = 0; 
                    
                    info.addEventListener('transitionend', () => {
                        info.remove();
                        infoContent.style.bottom = 0;
                        info.style.opacity = 1;
    
                        info.onclick = null;
                    })
                }
            }   
        }
    
        if(dayBlock.querySelector('.lessons__content').lastChild) // есть дни, когда нет пар, поэтому прежде чем удалять, проверяем
            dayBlock.querySelector('.lessons__content').lastChild.lastChild.style.display = 'none'; // удаление подчеркивания у последнего элемента
        
        // обработка свайпа
        // событие начала касания экрана
        dayBlock.ontouchstart = () => {
            let firstTouchX;

            // обработка движение - у lessons релативная позиция, изменяем смешение вправо на разность первого касания и координаты текущего касания
            const MIN_X_CHANGE = 28;
            
            dayBlock.ontouchmove = function(evt){
                if(!firstTouchX)
                    firstTouchX = evt.changedTouches[0].pageX;

                if(Math.abs(firstTouchX - evt.changedTouches[0].pageX) > MIN_X_CHANGE){
                    if(firstTouchX < evt.changedTouches[0].pageX)
                        dayBlock.style.right = `${((firstTouchX + MIN_X_CHANGE - evt.changedTouches[0].pageX) / 1.3)}px`;
                    else
                        dayBlock.style.right = `${((firstTouchX - MIN_X_CHANGE - evt.changedTouches[0].pageX) / 1.3)}px`;
                }
                
            
                // если firstTouchX больше, показываем следующий день
                dayBlock.ontouchend = () => {
                    if(Math.abs(firstTouchX - evt.changedTouches[0].pageX) > MIN_X_CHANGE){
                        let previousDayCount = dayCount -1 === 0 ? 5 : dayCount-1;
                        let nextDayCount = dayCount + 1 === 6 ? 1 : dayCount+1;
                        
                        let selectedDay;
                        for(weekDay of weekDays){
                            if(weekDay.isHightLight)
                                selectedDay = weekDay;  
                        }
                        let newDay;
                        let oldDay = dayBlock;
                        
                        oldDay.classList = 'lessons'; // сбрасываем классы предыдущего дня
                        oldDay.classList.add('lessons__dropOld');
                        
                        if(firstTouchX < evt.changedTouches[0].pageX){
                            
                            newDay = loadDay(previousDayCount, groupeName);
                            newDay.classList.add('lessons__insertNew');
                            setBgAndColor(selectedDay, '100%', '50%', BLACK);
                            setBgAndColor(weekDays[previousDayCount - 1]);
                            
                            oldDay.style.animationName = 'dropLessonsRight';
                            newDay.style.animationName = 'insertLessonsRight';
                        }else{
                            
                            newDay = loadDay(nextDayCount, groupeName);
                            newDay.classList.add('lessons__insertNew');
                            
                            setBgAndColor(selectedDay, '0%', '50%', BLACK);
                            setBgAndColor(weekDays[nextDayCount - 1], '50%', '100%');
                            
                            oldDay.style.animationName = 'dropLessonsLeft';
                            newDay.style.animationName = 'insertLessonsLeft';     
                        }
                        
                        document.body.firstElementChild.after(newDay);
                        
                        oldDay.style.top = `${newDay.getBoundingClientRect().top + pageYOffset}px`;
                        oldDay.addEventListener('animationend', () => {
                            oldDay.remove();
                        });
                        
                        dayBlock.ontouchstart = null;
                        dayBlock.ontouchmove = null;
                        dayBlock.ontouchend = null;
                    }else{
                        dayBlock.style.right = "0px";
                    }
                    firstTouchX = null;
                    firstTouchY = null;
                }
            }
        }
    
        dayBlock.dayCount = dayCount;

        selectCurrentLesson(dayBlock);
        
        return dayBlock;    
    }
    let weekDays = document.querySelectorAll('.week-days__day'); // кнопки дней
    let nowDay = NOW.getDay() === 6 || NOW.getDay() === 0 ? 1 : NOW.getDay(); // если сейчас выходные - выбрать понедельник

    // загрузка карточки с парами для сегодняшнего дня
    document.body.firstElementChild.after(loadDay(nowDay, groupeName));

    // выделение активного дня
    function setBgAndColor(elem, bgPos = '50%', bgDefaultPos = '0%', color = WHITE) {
        // тут сначала градиент переезжает в нужную сторону без transition, чтобы потом с нужной стороны выкатиться 
        elem.style.transition = '';
        elem.style.backgroundPosition = bgDefaultPos;
        elem.isHightLight = (bgPos =='50%');
        setTimeout(() => {
            elem.style.transition = `${DURATION}ms ease`;
            elem.style.backgroundPosition = bgPos;
            elem.style.color = color; 
        }, 50);
    }

    // добавление обработчика нажатия на кнопки дней
    for (let i = 0; i < weekDays.length; i++) {
        setBgAndColor(weekDays[i], '0%', '0%', BLACK);

        // выделение сегодняшнего дня в рамку
        if (i == NOW.getDay()-1)
            weekDays[i].style.border = `1.5px solid ${MAIN_COLOR}`;

        // в листенере не стрелочная функция, потому что нужен this, хотя я там его не совсем использую, можно пересмотреть
        weekDays[i].addEventListener('click', function(){
            let selectedDay;
            for(weekDay of weekDays){
                if(weekDay.isHightLight)
                    selectedDay = weekDay;  
            }

            weekDays = Array.from(weekDays);
            if(document.querySelectorAll('.lessons').length < 2){
                if(weekDays.indexOf(selectedDay) != weekDays.indexOf(event.target)){
                    let newDay = loadDay(i+1, groupeName);
                    let oldDay = document.querySelector('.lessons');
                    
                    oldDay.classList = 'lessons'; // сбрасываем классы предыдущего дня
                    oldDay.classList.add('lessons__dropOld');
                    
                    newDay.classList.add('lessons__insertNew');
                    
                    

                    if(weekDays.indexOf(selectedDay) > weekDays.indexOf(event.target)){
                        setBgAndColor(selectedDay, '100%', '50%', BLACK);
                        setBgAndColor(event.target);
                        
                        oldDay.style.animationName = 'dropLessonsRight';
                        newDay.style.animationName = 'insertLessonsRight';
                    }else{
                        setBgAndColor(selectedDay, '0%', '50%', BLACK);
                        setBgAndColor(event.target, '50%', '100%');

                        oldDay.style.animationName = 'dropLessonsLeft';
                        newDay.style.animationName = 'insertLessonsLeft'; 
                    }

                    document.body.firstElementChild.after(newDay);

                    oldDay.style.top = `${newDay.getBoundingClientRect().top + pageYOffset}px`;

                    oldDay.addEventListener('animationend', () => {oldDay.remove();});
                }
            }
            
            // selectCurrentLesson();
        })
    }

    setBgAndColor(weekDays[nowDay - 1]);

    //работа с элементом week-color
    let currentWeerColorElem = document.querySelector('.week-color');
    currentWeerColorElem.style.color = getCurentWeekColor(); // функция описана выше
    currentWeerColorElem.firstChild.innerText = getCurentWeekColor() == RED ? 'Красная неделя' : 'Синяя неделя';
    currentWeerColorElem.lastChild.style.backgroundColor = getCurentWeekColor();

    // если есть блок с выбором группы, убиваем его, и даем всем элементам под ним быть видимыми
    if(document.querySelector('.groupes')){
        document.body.querySelectorAll('*').forEach((elem) => {elem.style.opacity = '1';});
        document.querySelector('.groupes').remove();  
    }

}

// выбор теукущей пары, после загрузки документа вызывается каждую минуту, или при переключении дня
function selectCurrentLesson(lessonsElem){
    let currentLessonCount;
    for(let i = 0; i < START_TIMES.length; i++){
        if(TRUE_NOW.getTime() - START_TIMES[i] <= (90*60*1000) && TRUE_NOW.getTime() - START_TIMES[i] >= 0){
            currentLessonCount = i+1;
            break;
        }
    }
    if(lessonsElem.querySelector(`#l${currentLessonCount}`) && lessonsElem.dayCount === NOW.getDay())
    lessonsElem.querySelector(`#l${currentLessonCount}`).style.color = getCurentWeekColor();
}  

// когда документ полностью загрузился
document.addEventListener('DOMContentLoaded', () => {
    // если ничего про группы не было сохранено, предлагаем выбрать
    if(!sessionStorage.groupe){
        let groupesElement = document.createElement('div');
        groupesElement.className = 'groupes';
        groupesElement.innerHTML = `
        <h1 class="groupes__title">Добрый день</h1>
        <form name="groupe" class="groupes__forms-cont" onsubmit="return false;">
            <label class="groupes__form-title" for="form">Введите группу</label>
            <div class="btn-form">
                <input class="form" name="form" type="text" placeholder="Например: ${groupes[getRnd(0, groupes.length-1)]}"></input>
                <button class="submit">></button>
            </div>
        </form>
        <div class="groupes__cont"> </div>`;
        document.body.append(groupesElement);
        
        for(groupeName of groupes){
            let groupe = document.createElement('div');
            groupe.className = 'groupes__groupe';
            groupe.innerText = groupeName;
    
            groupe.onclick = () =>{
                loadAll(groupe.innerText);
                sessionStorage.groupe = groupe.innerText;
            }
            
            groupesElement.querySelector('.groupes__cont').append(groupe);
        }
        
        document.querySelector('.submit').onclick = () => {
            let groupeIs = false;
            for(groupeName of groupes){
                if(document.forms.groupe.form.value.toUpperCase() == groupeName)
                    groupeIs = true;
            }
            if(groupeIs){
                let currentGroupeName = document.forms.groupe.form.value.toUpperCase();
                loadAll(currentGroupeName);
                sessionStorage.groupe = currentGroupeName;
            }
            else{
                document.querySelector('.form').style.borderColor = 'red';
                setTimeout(() => {
                    document.querySelector('.form').style.borderColor = MAIN_COLOR;
                }, 4000)
                
            }
        }
        // убираем все элементы и на абсолютной позиции показываем выбор групп
        document.body.querySelectorAll('*').forEach((elem) => {elem.style.opacity = '0';});
        document.querySelector('.groupes').style.opacity = '1';     
        document.querySelectorAll('.groupes *').forEach((elem) => {elem.style.opacity = '1';}); 
    }else{
        loadAll(sessionStorage.groupe);
    }

    //добавление настроек, они тоже показываются поверх невидимых элементов на абсолютной позиции
    document.querySelector('#nav_s').onclick = () =>{
        if(!document.querySelector('.settings')){
            document.body.querySelectorAll('*').forEach((elem) => {
                if(!(elem.classList.value.includes('navbar'))){
                    elem.style.transition = 'none';
                    elem.style.visibility = 'hidden';
                }
            });

            let settingsCont = document.createElement('div');
            settingsCont.className = 'settings'
    
            settingsCont.innerHTML = `<h2 class="settings__title">Настройки</h2>
            <div class="settings__content">
            <form name="groupe" class="groupes__forms-cont" onsubmit="return false;">
                <label class="groupes__form-title" for="form">Введите новую группу</label>
                <div class="btn-form">
                    <input class="form" name="form" type="text" placeholder="Например: ${groupes[getRnd(0, groupes.length-1)]}"></input>
                    <button class="submit">></button>
                </div>
            </form>
            </div>`;
            document.body.append(settingsCont)
            
            document.querySelector('.submit').onclick = () => {
                
                let groupeIs = false;
                for(groupeName of groupes){
                    if(document.forms.groupe.form.value.toUpperCase() == groupeName)
                    groupeIs = true;
                }
                
                if(groupeIs){
                    let currentGroupeName = document.forms.groupe.form.value.toUpperCase();

                    sessionStorage.groupe = currentGroupeName;
                    window.location.reload();
                }
                else{
                    document.querySelector('.form').style.borderColor = 'red';
                    setTimeout(() => {
                        document.querySelector('.form').style.borderColor = MAIN_COLOR;
                    }, 4000)
                }
            }
        }
    }

    document.querySelector('#nav_l').onclick = () =>{
        if(document.querySelector('.settings')){
            document.body.querySelectorAll('*').forEach((elem) => {elem.style.visibility = 'visible';});
            document.querySelector('.settings').remove();
        }
    }
    // определяем высоту приложение на весь доступный экран
    document.body.style.height = `${window.innerHeight}px`;
})