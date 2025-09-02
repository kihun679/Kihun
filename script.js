document.addEventListener('DOMContentLoaded', function() {
    // 1. 상수 및 데이터 정의
    const STARTING_SCORE = 29;
    const checklistData = {
        health: { title: "건강", items: [ { id: 'eat_breakfast', text: '아침식사', points: 1 }, { id: 'eat_lunch', text: '점심식사', points: 1 }, { id: 'eat_dinner', text: '저녁식사', points: 1 }, { id: 'late_snack', text: '야식', points: -2 }, { id: 'sugar_drink', text: '당분음료', points: -5 }, { id: 'sleep_before_12', text: '전날 12시 이전 수면', points: 6 }, { id: 'wakeup_before_7', text: '7시 이전 기상', points: 6 }, ] },
        dopamine: { title: "도파민 디톡스", items: [ { id: 'no_youtube', text: '유튜브', points: -6 }, { id: 'no_game', text: '게임', points: -6 }, { id: 'no_harmful', text: '유해물', points: -6 }, { id: 'no_community', text: '커뮤니티', points: -4 }, { id: 'cold_shower', text: '찬물샤워', points: 2 } ] },
        study: { title: "공부", items: [ { id: 'study_commute_am', text: '등굣길 공부', points: 2 }, { id: 'study_commute_pm', text: '하굣길 공부', points: 2 } ], slider: { min: 0, max: 8, points: [0, 3, 3, 3, 3, 3, 3, 3, 3] } },
        routines: { title: "데일리 루틴", items: [ { id: 'ticktick_clear', text: 'TickTick 당일 계획 전부 수행', points: 4 }, { id: 'emotion_journal', text: '감정 적기', points: 3 }, { id: 'meditation', text: '호흡 명상', points: 2 }, { id: 'plan_tomorrow', text: '전날 계획 세우기', points: 2 }, { id: 'skin_care', text: '피부관리 루틴', points: 2 }, { id: 'read_before_sleep', text: '잠들기 전 독서', points: 2 }, { id: 'oral_hygiene', text: '구강 위생', points: 2 } ] }
    };

    // 2. DOM 요소 및 상태 변수
    const scoreDisplay = document.getElementById('score-display');
    const currentDateEl = document.getElementById('current-date');
    const calendarEl = document.getElementById('calendar');
    const monthYearDisplay = document.getElementById('month-year-display');
    const journalModal = document.getElementById('journal-modal');
    const journalMemo = document.getElementById('journal-memo');
    
    let today = new Date();
    let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let displayDate = new Date(selectedDate);
    
    // 3. 헬퍼 및 유틸리티 함수
    function getScoreColor(score) { const p = Math.max(0,Math.min(100,score))/100; return `hsl(${p*120}, 70%, 45%)`; }
    function updateScoreColor(score) { scoreDisplay.style.backgroundColor = getScoreColor(score); }
    function formatDate(d) { return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; }
    function getDateString(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    function formatMonthYear(d) { return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; }

    function openJournalModal() {
        const data = getStoredData(getDateString(selectedDate));
        journalMemo.value = data.journalMemo || '';
        journalModal.style.display = 'flex';
    }

    function closeJournalModal() {
        journalModal.style.display = 'none';
    }

    // 4. 데이터 관리 함수
    function getStoredData(dateString) {
        const stored = localStorage.getItem(dateString);
        if (stored) return JSON.parse(stored);

        const initialData = { 
            score: STARTING_SCORE, studyHours: 0, checkedItems: {},
            exerciseChecked: false, exerciseChoices: [], journalMemo: '' 
        };
        Object.keys(checklistData).forEach(catKey => {
            checklistData[catKey].items?.forEach(item => initialData.checkedItems[item.id] = false);
        });
        initialData.checkedItems['daily_journal'] = false; // 일기 항목 초기화
        return initialData;
    }

    function loadStateForDate(dateString) {
        const data = getStoredData(dateString);
        
        Object.keys(data.checkedItems).forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = data.checkedItems[id];
                const parentItem = checkbox.closest('.checklist-item');
                if(parentItem) parentItem.classList.toggle('checked', checkbox.checked);
            }
        });
        
        const mainExerciseBtn = document.getElementById('exercise-main-button');
        const choicesContainer = document.getElementById('exercise-choices');
        mainExerciseBtn.classList.toggle('checked', data.exerciseChecked);
        choicesContainer.classList.toggle('visible', data.exerciseChecked);

        choicesContainer.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('selected', data.exerciseChoices && data.exerciseChoices.includes(btn.dataset.part));
        });

        const slider = document.getElementById('study-slider');
        slider.value = data.studyHours || 0;
        slider.dispatchEvent(new Event('input'));
        
        updateScore();
    }

    function updateScore() {
        let score = STARTING_SCORE;
        const data = getStoredData(getDateString(selectedDate));
        const checkedItems = data.checkedItems || {};

        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.checked) { score += parseInt(cb.dataset.points); }
        });

        if(data.exerciseChecked){ score += 6; }

        const studyHours = data.studyHours || 0;
        let currentStudyPoints = 0;
        for (let i = 1; i <= studyHours; i++) {
            currentStudyPoints += checklistData.study.slider.points[i];
        }
        score += currentStudyPoints;
        
        scoreDisplay.textContent = score;
        updateScoreColor(score);
        
        data.score = score;
        localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
        
        renderCalendarScores();
    }

    // 5. UI 렌더링 함수
    function createElements() {
        const healthCard = document.getElementById('health-card');
        healthCard.innerHTML = `<h3>${checklistData.health.title}</h3><div class="horizontal-blocks">${ checklistData.health.items.map(item => `<div class="block-item"><input type="checkbox" id="${item.id}" data-points="${item.points}"><label for="${item.id}"><span class="item-text">${item.text}</span><span class="item-points ${item.points > 0 ? 'points-positive':'points-negative'}">${item.points > 0 ? '+' : ''}${item.points}</span></label></div>`).join('') }</div>`;

        const exerciseCard = document.getElementById('exercise-card');
        const exerciseParts = ['등', '어깨', '가슴', '이두', '삼두', '전신', '하체'];
        exerciseCard.innerHTML = `<h3>운동 (+6)</h3> <button id="exercise-main-button">오늘 운동을 기록하려면 클릭</button> <div id="exercise-choices"> ${exerciseParts.map(part => `<button data-part="${part}">${part}</button>`).join('')} </div>`;

        const dopamineCard = document.getElementById('dopamine-card');
        dopamineCard.innerHTML = `<h3>${checklistData.dopamine.title}</h3><div class="horizontal-blocks">${ checklistData.dopamine.items.map(item => `<div class="block-item"><input type="checkbox" id="${item.id}" data-points="${item.points}"><label for="${item.id}"><span class="item-text">${item.text}</span><span class="item-points ${item.points > 0 ? 'points-positive':'points-negative'}">${item.points > 0 ? '+' : ''}${item.points}</span></label></div>`).join('') }</div>`;

        const studyCard = document.getElementById('study-card');
        studyCard.innerHTML = `<h3>${checklistData.study.title}</h3><div id="study-checklist"></div><div class="study-slider-container"><input type="range" min="0" max="8" value="0" id="study-slider"><div class="slider-output"><span id="study-hours-display">0 시간</span> / <span id="study-points-display">+0</span></div></div>`;
        studyCard.querySelector('#study-checklist').innerHTML = checklistData.study.items.map(item => createChecklistItemHTML(item)).join('');
        
        const routineCard = document.getElementById('routine-card');
        routineCard.innerHTML = `<h3>${checklistData.routines.title}</h3><div id="routine-checklist"></div>`;
        const routineChecklistContainer = routineCard.querySelector('#routine-checklist');
        
        // 일기 항목 별도 생성
        const journalItemHTML = createChecklistItemHTML({id: 'daily_journal', text: '일기 적기', points: 3});
        routineChecklistContainer.innerHTML += journalItemHTML;
        
        // 나머지 루틴 항목 추가
        routineChecklistContainer.innerHTML += checklistData.routines.items.map(item => createChecklistItemHTML(item)).join('');
        
        addEventListeners();
    }
    
    function createChecklistItemHTML(item) {
        return `<div class="checklist-item" id="item-${item.id}">
            <label>
                <input type="checkbox" id="${item.id}" data-points="${item.points}">
                <span>${item.text}</span>
            </label>
            <span class="points points-positive">+${item.points}</span>
        </div>`;
    }

    function addEventListeners() {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const data = getStoredData(getDateString(selectedDate));
                data.checkedItems[cb.id] = cb.checked;
                localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
                document.getElementById(`item-${cb.id}`).classList.toggle('checked', cb.checked);
                updateScore();
            });
        });

        // 일기장 항목 클릭 이벤트 (모달 열기)
        document.getElementById('item-daily_journal').addEventListener('click', (e) => {
            e.preventDefault();
            openJournalModal();
        });

        document.getElementById('study-slider').addEventListener('input', () => {
            const slider = document.getElementById('study-slider');
            const hours = slider.value;
            document.getElementById('study-hours-display').textContent = `${hours} 시간`;
            let currentStudyPoints = 0;
            for (let i = 1; i <= hours; i++) { currentStudyPoints += checklistData.study.slider.points[i]; }
            document.getElementById('study-points-display').textContent = `+${currentStudyPoints}`;
            
            const data = getStoredData(getDateString(selectedDate));
            data.studyHours = parseInt(hours);
            localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
            updateScore();
        });
        
        const mainExerciseBtn = document.getElementById('exercise-main-button');
        const choicesContainer = document.getElementById('exercise-choices');
        
        mainExerciseBtn.addEventListener('click', () => {
            const data = getStoredData(getDateString(selectedDate));
            data.exerciseChecked = !data.exerciseChecked;
            if (!data.exerciseChecked) { data.exerciseChoices = []; }
            localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
            loadStateForDate(getDateString(selectedDate));
        });

        choicesContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const data = getStoredData(getDateString(selectedDate));
                if (!Array.isArray(data.exerciseChoices)) { data.exerciseChoices = []; }
                const part = btn.dataset.part;
                const index = data.exerciseChoices.indexOf(part);
                if (index > -1) { data.exerciseChoices.splice(index, 1); } 
                else { data.exerciseChoices.push(part); }
                localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
                loadStateForDate(getDateString(selectedDate));
            });
        });
    }

    function renderCalendar() { /* ... 이전과 동일 ... */ }
    function renderCalendarScores() { /* ... 이전과 동일 ... */ }
    
    // 6. 앱 초기화
    function initializeApp() {
        currentDateEl.textContent = formatDate(selectedDate);
        createElements();
        renderCalendar();
        loadStateForDate(getDateString(selectedDate));
        
        document.getElementById('prev-month').addEventListener('click', () => {
            displayDate.setMonth(displayDate.getMonth() - 1);
            renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            displayDate.setMonth(displayDate.getMonth() + 1);
            renderCalendar();
        });

        // 일기장 모달 버튼 이벤트
        document.getElementById('save-journal').addEventListener('click', () => {
            const dateString = getDateString(selectedDate);
            const data = getStoredData(dateString);

            data.journalMemo = journalMemo.value;
            const isJournalWritten = journalMemo.value.trim() !== '';
            data.checkedItems['daily_journal'] = isJournalWritten;
            
            localStorage.setItem(dateString, JSON.stringify(data));
            
            const journalCheckbox = document.getElementById('daily_journal');
            if(journalCheckbox) {
                journalCheckbox.checked = isJournalWritten;
                document.getElementById('item-daily_journal').classList.toggle('checked', isJournalWritten);
            }
            
            updateScore();
            closeJournalModal();
        });

        document.getElementById('cancel-journal').addEventListener('click', closeJournalModal);
    }

    initializeApp();

    // renderCalendar와 renderCalendarScores 함수를 여기에 복사합니다 (이전 답변과 동일).
    function renderCalendar() {
        const year = displayDate.getFullYear(), month = displayDate.getMonth();
        monthYearDisplay.textContent = formatMonthYear(displayDate);
        calendarEl.innerHTML = '';
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        ['일','월','화','수','목','금','토'].forEach(name => {
            const dayNameEl = document.createElement('div'); dayNameEl.className = 'day-name'; dayNameEl.textContent = name; calendarEl.appendChild(dayNameEl);
        });
        for (let i = 0; i < firstDayOfMonth; i++) calendarEl.appendChild(document.createElement('div'));
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            const dayDate = new Date(year, month, i);
            const dateString = getDateString(dayDate);
            dayEl.className = 'day';
            dayEl.dataset.date = dateString;
            dayEl.innerHTML = `<span class="date-num">${i}</span><span class="score"></span>`;
            if (dateString === getDateString(selectedDate)) dayEl.classList.add('selected');
            if (dateString === getDateString(new Date())) dayEl.classList.add('today');
            dayEl.addEventListener('click', () => {
                selectedDate = dayDate;
                currentDateEl.textContent = formatDate(selectedDate);
                document.querySelectorAll('.day.selected').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                loadStateForDate(dateString);
            });
            calendarEl.appendChild(dayEl);
        }
        renderCalendarScores();
    }
    
    function renderCalendarScores() {
         document.querySelectorAll('.day[data-date]').forEach(dayEl => {
            const dateString = dayEl.dataset.date;
            const data = getStoredData(dateString);
            if(data.score !== STARTING_SCORE || data.exerciseChecked || (data.checkedItems && data.checkedItems.daily_journal)){
                const scoreEl = dayEl.querySelector('.score');
                scoreEl.textContent = data.score;
                scoreEl.style.color = getScoreColor(data.score);
            } else {
                 const scoreEl = dayEl.querySelector('.score');
                 scoreEl.textContent = '';
            }
        });
    }
});