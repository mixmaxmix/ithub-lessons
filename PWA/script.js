function getRnd(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; // максимум и минимум включаются
}

function hexToRgb(color) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
} 

// week - объект, где ключи - дни недели, а значения - массивы с парами, сгенерирован автоматически на основе таблицы с расписанием
// groupes - массив с назаваниями групп
async function getWeek(groupe){
    let response = await fetch(`sourses/weeks/${groupe}_week.json`);
    return response;
}
async function getGroupes(){
    let response = await fetch(`sourses/groupes.json`);
    return response.json();
}
// notification - массив объектов уведомлений
async function getNotificationsArray(groupe){
    let response = await fetch(`sourses/notification/${groupe}_notifications.json`);
    return response;
}

const DAYS = ['понедельник', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'понедельник'];
const NOW = new Date(Date.now());
const TRUE_NOW = new Date(NOW); // копируем объект NOW, потому что потом для NOW изменяется время. Не использую везде просто Date.now(), потому что потом будем дату присылать с сервера возможно
const START_TIMES = [NOW.setHours(10, 0), NOW.setHours(11, 40), NOW.setHours(14, 0), NOW.setHours(15, 40), NOW.setHours(17, 20), NOW.setHours(19, 0), NOW.setHours(20, 40)]; // времена начала пар, в дальнейшем будут лежать на сервере
const DURATION = 400; // количество ms для длительности анимаций

// цвета
const BLUE = '#5577D7';
const RED = '#FF5157';
const LGREY = '#F4F6F7';
const BLACK = '#313131';
const WHITE = '#FFFFFF';
const MAIN_COLOR = '#7D14F3';
const GREY = '#C0C1C2';

let activeTab = 'lessons';

// возвращает HEX цвет в зависимости от цета недели 
// TODO: переделать так, чтобы возвращала название, и в тех местах где нужен цвет из объекта WEEK_COLORS будет выниматься по строке-ключу необходимое HEX значение
function getCurentWeekColor(){
    let dateToProcess = new Date(NOW.setHours(0,0,0));
    let currentYear = new Date(NOW.getFullYear(), 0, 1);

    dateToProcess.setDate(NOW.getDate() + 4 - (NOW.getDay()||7));
    
    let currentWeekColor = (Math.floor(((dateToProcess - currentYear) / 1000 / 60 /60 / 24 + 1) / 7) % 2) === 0 ? RED : BLUE;
    if(NOW.getDay() == 6 || NOW.getDay() == 0){
        currentWeekColor = currentWeekColor === RED ? BLUE : RED;
    }
    
    return currentWeekColor;
}

// функция, которая загружает весь интерфейс расписания
async function loadLessons(groupeName){
    function loadDay(dayCount) {
        let dayBlock = document.createElement('div');
        dayBlock.innerHTML = `
            <h3 class="lessons__title"></h3>
            <div class="lessons__content"></div>`;
        dayBlock.className = 'lessons';

        dayBlock.ontouchstart = () => {
            let firstTouchX;
            let firstTouchY;
            // обработка движения - у lessons релативная позиция, изменяем смешение вправо на разность первого касания и координаты текущего касания
            const MIN_X_CHANGE = 25;  
            
            let blockSwipe = evt => {
                if(!firstTouchY)
                    firstTouchY = evt.changedTouches[0].pageY;  
                    
                if(Math.abs(firstTouchY - evt.changedTouches[0].pageY) > 30){
                    firstTouchY = null;
                    dayBlock.removeEventListener('touchmove', swipe);
                }
            }

            let swipe = evt => {
                if(!firstTouchX)
                    firstTouchX = evt.changedTouches[0].pageX;  
                
                if(Math.abs(firstTouchX - evt.changedTouches[0].pageX) > MIN_X_CHANGE){
                    if(firstTouchX < evt.changedTouches[0].pageX)
                        dayBlock.style.right = `${((firstTouchX + MIN_X_CHANGE - evt.changedTouches[0].pageX) / 1.3)}px`;
                    else
                        dayBlock.style.right = `${((firstTouchX - MIN_X_CHANGE - evt.changedTouches[0].pageX) / 1.3)}px`;

                    dayBlock.removeEventListener('touchmove', blockSwipe);

                    // если firstTouchX больше, показываем следующий день
                    dayBlock.ontouchend = () => {                        
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
                        oldDay.classList.add('lessons_dropOld');
                        
                        if(firstTouchX < evt.changedTouches[0].pageX){
                            
                            newDay = loadDay(previousDayCount, groupeName);
                            newDay.classList.add('lessons_insertNew');
                            setBgAndColor(selectedDay, '100%', '50%', BLACK);
                            setBgAndColor(weekDays[previousDayCount - 1]);
                            
                            oldDay.style.animationName = 'dropLessonsRight';
                            newDay.style.animationName = 'insertLessonsRight';
                        }else{
                            
                            newDay = loadDay(nextDayCount, groupeName);
                            newDay.classList.add('lessons_insertNew');
                            
                            setBgAndColor(selectedDay, '0%', '50%', BLACK);
                            setBgAndColor(weekDays[nextDayCount - 1], '50%', '100%');
                            
                            oldDay.style.animationName = 'dropLessonsLeft';
                            newDay.style.animationName = 'insertLessonsLeft';     
                        }
                        
                        document.querySelector('#app').prepend(newDay);
                        
                        oldDay.style.top = `${newDay.getBoundingClientRect().top + pageYOffset}px`;
                        oldDay.style.height = `${newDay.offsetHeight}px`;

                        oldDay.addEventListener('animationend', () => {
                            oldDay.remove();
                        });
                        
                        dayBlock.ontouchstart = null;
                        dayBlock.removeEventListener('touchmove', swipe);
                        dayBlock.ontouchend = null;
                        firstTouchX = null;
                    }
                }
            }
            dayBlock.addEventListener('touchmove', blockSwipe);
            dayBlock.addEventListener('touchmove', swipe);
        }
        dayBlock.dayCount = dayCount;
        
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

        dayBlock.querySelector('.lessons__title').innerHTML = dayDesc + ',&nbsp' + `<b> ${DAYS[dayCount]}</b>`;
        
        // если не завезли объект с парами, то наполнение lessons - только один элемент lesson с классом-модификатором lesson_error
        if(!week){
            let errorElem = document.createElement('div');
            errorElem.classList.add('lesson_error', 'lesson');
            errorElem.innerHTML = 'Извините, произошла ошибка'
            dayBlock.querySelector('.lessons__content').append(errorElem);
            
            return dayBlock
        }

        let currentWeekColor = getCurentWeekColor() === RED ? 'RED' : 'BLUE';
        
        let currentDay = week[DAYS[dayCount]];

        let lessonsCount = 0;
        for(lesson of currentDay){
            if(lesson[currentWeekColor] || lesson.title) lessonsCount++;
        }

        let lessonsCountPhrase = ', ' +lessonsCount + `${lessonsCount == 0 ? ' пар' : lessonsCount == 1 ? ' пара' : ' пары'}`;
        
        dayBlock.querySelector('.lessons__title').innerHTML += lessonsCountPhrase ? lessonsCountPhrase : '';
    
        // заполнение расписанием - создание карточек с парами
        for (let i = 0; i < currentDay.length; i++) {
            let currentLesson = currentDay[i];
            // обработка разноцветности уроков
            if(currentLesson.RED || currentLesson.BLUE){
                if(currentLesson[currentWeekColor]){
                    tempCount = currentLesson.count;
                    currentLesson = currentLesson[currentWeekColor];
                    currentLesson.count = tempCount;
                }
                else continue
            }
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
            
            let startTimeMin = startTime.getMinutes() / 10 === 0 ? `0${startTime.getMinutes()}` : startTime.getMinutes();
            let endTimeMin = endTime.getMinutes() / 10 === 0 ? `0${endTime.getMinutes()}` : endTime.getMinutes();

            times[0].innerText = `${startTime.getHours()}:${startTimeMin} `;
            times[1].innerText = `${endTime.getHours()}:${endTimeMin} `;
    
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
                <!--
                <span class="lesson-info__days-title lesson-info_txt">У вас эта пара в эти дни: </span>
                <div class="week-days">
                    <span class="week-days__day">Пн</span>
                    <span class="week-days__day">Вт</span>
                    <span class="week-days__day">Ср</span>
                    <span class="week-days__day">Чт</span>
                    <span class="week-days__day">Пт</span>
                </div>
                -->
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
                if(lessonCard.goesNow){
                    info.querySelector('.lesson-info__count').innerText += ', идет сейчас'
                }
            }
    
            info.onanimationend = () => {
                info.onclick = () => {
                    infoContent.style.bottom = `-${infoContent.offsetHeight}px`;
                    info.style.opacity = 0; 
                    
                    info.addEventListener('transitionend', () => {
                        info.remove();
                        infoContent.style.bottom = 0;
                        info.style.opacity = 1;
                        info.querySelector('.lesson-info__count').innerText = info.querySelector('.lesson-info__count').innerText.split(',')[0]
    
                        info.onclick = null;
                    })
                }
            }   
        }
    
        if(dayBlock.querySelector('.lessons__content').lastChild) // есть дни, когда нет пар, поэтому прежде чем удалять, проверяем
            dayBlock.querySelector('.lessons__content').lastChild.lastChild.style.display = 'none'; // удаление подчеркивания у последнего элемента
        
        // обработка свайпа

        // событие начала касания экрана
        

        selectCurrentLesson(dayBlock);
        
        return dayBlock;    
    }
    document.querySelector('.main__title').innerHTML = 'Расписание';

    let screen = document.querySelector('#app');
    screen.innerHTML = `
    <div class="week-color"><h4 class="week-color__text"></h4><div class="week-color__underline"></div></div>
    <div class="week-days">
    <span class="week-days__day">Пн</span>
    <span class="week-days__day">Вт</span>
    <span class="week-days__day">Ср</span>
    <span class="week-days__day">Чт</span>
    <span class="week-days__day">Пт</span>
    </div>`
    
    
    let nowDay = NOW.getDay() === 6 || NOW.getDay() === 0 ? 1 : NOW.getDay(); // если сейчас выходные - выбрать понедельник
    let week;

    
    let emptyLessons = document.createElement('div');
    emptyLessons.classList.add('lessons', 'lessons_loading'); // пока грузится расписание, пользователь видит пустой контейнер пар (lessons), с класом-модификатором lessons_loading
    document.querySelector('#app').prepend(emptyLessons);

    getWeek(groupeName).then(async (res, rej) =>{
        if(emptyLessons) emptyLessons.remove();
        
        if(rej || !res.ok) {
            document.querySelector('#app').prepend(loadDay(nowDay)); // если произойдет ошибка, отработает неблагоприятный вариант в loadDay (там написано)
            return
        };
        
        week = await res.json();
            
        document.querySelector('#app').prepend(loadDay(nowDay));
    });
    // загрузка карточки с парами для сегодняшнего дня

    let weekDays = document.querySelectorAll('.week-days__day'); // кнопки дней

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

        weekDays[i].addEventListener('click', evt => {
            let selectedDay;
            for(weekDay of weekDays){
                if(weekDay.isHightLight)
                    selectedDay = weekDay;  
            }

            weekDays = Array.from(weekDays);
            if(document.querySelectorAll('.lessons').length < 2){
                if(weekDays.indexOf(selectedDay) != weekDays.indexOf(evt.target)){
                    let newDay = loadDay(i+1);
                    let oldDay = document.querySelector('.lessons');
                    
                    oldDay.classList = 'lessons'; // сбрасываем классы предыдущего дня
                    oldDay.classList.add('lessons_dropOld');
                    
                    newDay.classList.add('lessons_insertNew');
                    
                    if(weekDays.indexOf(selectedDay) > weekDays.indexOf(evt.target)){
                        setBgAndColor(selectedDay, '100%', '50%', BLACK);
                        setBgAndColor(evt.target);
                        
                        oldDay.style.animationName = 'dropLessonsRight';
                        newDay.style.animationName = 'insertLessonsRight';
                    }else{
                        setBgAndColor(selectedDay, '0%', '50%', BLACK);
                        setBgAndColor(evt.target, '50%', '100%');

                        oldDay.style.animationName = 'dropLessonsLeft';
                        newDay.style.animationName = 'insertLessonsLeft'; 
                    }

                    document.querySelector('#app').prepend(newDay);

                    oldDay.style.top = `${newDay.getBoundingClientRect().top + pageYOffset}px`;
                    oldDay.style.height = `${newDay.offsetHeight}px`;

                    oldDay.addEventListener('animationend', () => {oldDay.remove();});
                }
            }
            
            // selectCurrentLesson();
        })
    }

    setBgAndColor(weekDays[nowDay - 1]);

    //работа с элементом week-color
    let currentWeekColorElem = document.querySelector('.week-color');
    currentWeekColorElem.style.color = getCurentWeekColor(); // функция описана выше
    currentWeekColorElem.firstChild.innerText = getCurentWeekColor() == RED ? 'Красная неделя' : 'Синяя неделя';
    currentWeekColorElem.lastChild.style.backgroundColor = getCurentWeekColor();

    // если есть блок с выбором группы, убиваем его, и даем всем элементам под ним быть видимыми
    if(document.querySelector('.groupes')){
        document.body.querySelectorAll('*').forEach((elem) => {elem.style.visibility = 'visible';});
        document.querySelector('.groupes').remove();  
    }

}

// выбор пары, которая идет в данный момент. Вызывается при переключении дня
function selectCurrentLesson(lessonsElem){
    let currentLessonCount;
    for(let i = 0; i < START_TIMES.length; i++){
        if(TRUE_NOW.getTime() - START_TIMES[i] <= (90*60*1000) && TRUE_NOW.getTime() - START_TIMES[i] >= 0){
            currentLessonCount = i+1;
            break;
        }
    }
    if(lessonsElem.querySelector(`#l${currentLessonCount}`) && lessonsElem.dayCount === NOW.getDay()){
        let nowLesson =  lessonsElem.querySelector(`#l${currentLessonCount}`);
        
        nowLesson.classList.add('lesson_now');   

        nowLesson.goesNow = true;
        nowLesson.querySelectorAll('*').forEach(elem => {elem.goesNow = true})
    }   
}  

// когда документ полностью загрузился
document.addEventListener('DOMContentLoaded', async () => {
    let themeColorTag = document.createElement('meta');
    themeColorTag.setAttribute('name', 'theme-color');
    themeColorTag.setAttribute('content', MAIN_COLOR);
    document.head.append(themeColorTag)

    document.documentElement.style.setProperty('--main-color', MAIN_COLOR); // магия происходит тут, я задаю CSS переменную, у которой значение определено в JS
    document.documentElement.style.setProperty('--black-color', BLACK);
    document.documentElement.style.setProperty('--white-color', WHITE);
    document.documentElement.style.setProperty('--lgrey-color', LGREY);

    // Подгрузка цветов для navbar
    document.querySelector('.navbar_notification').style.stroke = GREY;
    document.querySelector('.navbar_lessons').style.stroke = MAIN_COLOR;
    document.querySelectorAll('.navbar_settings').forEach(el => el.style.stroke = GREY);
    
    let groupes = await getGroupes();

    // если ничего про группы не было сохранено, предлагаем выбрать
    if(!localStorage.groupe){
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
        
        document.querySelector('#app').append(groupesElement);
        
        for(groupeName of groupes){
            let groupe = document.createElement('div');
            groupe.className = 'groupes__groupe';
            groupe.innerText = groupeName;
    
            groupe.onclick = () =>{
                loadLessons(groupe.innerText);
                localStorage.groupe = groupe.innerText;
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
                loadLessons(currentGroupeName);
                localStorage.groupe = currentGroupeName;
            }
            else{
                document.querySelector('.form').style.borderColor = 'red';
                setTimeout(() => {
                    document.querySelector('.form').style.borderColor = MAIN_COLOR;
                }, 4000)
                
            }
        }
        // убираем все элементы и на абсолютной позиции показываем выбор групп
        // document.body.querySelectorAll('*').forEach((elem) => {elem.style.visibility = 'hidden';});
        // document.querySelector('.groupes').style.visibility = 'visible';     
        // document.querySelectorAll('.groupes *').forEach((elem) => {elem.style.visibility = 'visible';}); 

    } else {
        loadLessons(localStorage.groupe);
    }

    
    document.querySelector('#nav_n').addEventListener('click', async () => {
        if (activeTab === 'notifications') return;

        activeTab = 'notifications';
        document.querySelector('.navbar_notification').style.stroke = MAIN_COLOR;
        document.querySelector('.navbar_lessons').style.stroke = GREY;
        document.querySelectorAll('.navbar_settings').forEach(el => el.style.stroke = GREY);
        
        document.querySelector('.main__title').innerHTML = 'Уведомления';
        
        document.querySelector('#app').innerHTML = '';

        let notificationsCont = document.createElement('div');
        notificationsCont.className = 'notifications__container';

        let notificationsArray = [];
        const notificationsResponse = await getNotificationsArray(localStorage.groupe);
        if(notificationsResponse.ok){
            notificationsArray = await notificationsResponse.json();
        }

        // если нет уведомлений, отрабатывает else
        if(notificationsArray.length != 0){
            notificationsArray.forEach(n => {
                const notification = document.createElement('div');
                notification.className = 'notification';
    
                if (n.type === 'change') {
                    notification.innerHTML = `
                    <div class="notifications__content">
                        <h3 class="notitfication__title notitfication_type-${n.importance}">${n.title}:</h3>
                        <div class="notifications_info">
                            <div class="lesson_was">
                                <span>${n.body.count} пара</span>
                                <span>${n.body.was.title}</span>
                            </div>
                            <div class="lesson_became">
                                <span>${n.body.count} пара</span>
                                <div>
                                    <span>${n.body.became.title} </span>
                                    <p class="aud_became">${n.body.became.aud} </p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                } else if (n.type === 'curator') {
                    notification.innerHTML = `
                    <div class="notifications__content">
                        <h3 class="notitfication__title notitfication_type-${n.importance}">${n.body.sender} сообщает:</h3>
                        <div class="notifications_info">
                            <p class="notification__content">${n.body.text}</p>
                        </div>   
                    </div>`;
                } else if (n.type === 'teacher') {
                    notification.innerHTML = `
                    <div class="notifications__content">
                        <h3 class="notitfication__title notitfication_type-${n.importance}">${n.body.sender} сообщает:</h3>
                        <div class="notifications_info">
                            <p class="notification__content">${n.body.text}</p>
                        <div/>
                    </div>`;
                }
    
                notificationsCont.append(notification);
            })
        }else{
            notificationsCont.innerHTML = 'Уведомлений нет';
        }
        
        document.querySelector('#app').append(notificationsCont);

    })

    document.querySelector('#nav_l').onclick = () => {
        if (activeTab === 'lessons') return;

        activeTab = 'lessons';
        document.querySelector('.navbar_notification').style.stroke = GREY;
        document.querySelector('.navbar_lessons').style.stroke = MAIN_COLOR;
        document.querySelectorAll('.navbar_settings').forEach(el => el.style.stroke = GREY);
        
        document.querySelector('#app').innerHTML = '';
        loadLessons(localStorage.groupe);
        
    }
    
    //добавление настроек, они тоже показываются поверх невидимых элементов на абсолютной позиции
    document.querySelector('#nav_s').addEventListener('click', () => {
        if (activeTab === 'settings') return;
        
        activeTab = 'settings';
        document.querySelector('.navbar_notification').style.stroke = GREY;
        document.querySelector('.navbar_lessons').style.stroke = GREY;
        document.querySelectorAll('.navbar_settings').forEach(el => el.style.stroke = MAIN_COLOR)
        
        document.querySelector('.main__title').innerHTML = 'Настройки';

        document.querySelector('#app').innerHTML = '';

        let settingsCont = document.createElement('div');
        settingsCont.className = 'settings'

        settingsCont.innerHTML = `
        <div class="settings__content">
        <form name="groupe" class="groupes__forms-cont" onsubmit="return false;">
            <label class="groupes__form-title" for="form">Введите новую группу</label>
            <div class="btn-form">
                <input class="form" name="form" type="text" placeholder="Текущая группа: ${localStorage.groupe}"></input>
                <button class="submit">></button>
            </div>
        </form>
        </div>`;
        document.querySelector('#app').append(settingsCont)

        document.querySelector('.submit').onclick = () => {

            let groupeIs = false;
            for (groupeName of groupes) {
                if (document.forms.groupe.form.value.toUpperCase() == groupeName) groupeIs = true;
            }

            if (groupeIs) {
                let currentGroupeName = document.forms.groupe.form.value.toUpperCase();

                localStorage.groupe = currentGroupeName;
                window.location.reload();
            }
            else {
                document.querySelector('.form').style.borderColor = 'red';
                setTimeout(() => {
                    document.querySelector('.form').style.borderColor = MAIN_COLOR;
                }, 4000)
            }
        }

    })

    
    // определяем высоту приложение на весь доступный экран
    document.body.style.height = `${window.innerHeight - 1}px`;
    document.querySelector('#app').style.height = `${document.body.offsetHeight - document.querySelector('.navbar').offsetHeight - document.querySelector('.main__title').offsetHeight}px`;
    window.addEventListener('resize', () => {
        document.body.style.height = `${window.innerHeight-1}px`;
        document.querySelector('#app').style.height = `${document.body.offsetHeight - document.querySelector('.navbar').offsetHeight - document.querySelector('.main__title').offsetHeight}px`;
    })
})