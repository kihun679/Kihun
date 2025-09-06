// 1. Firebase SDK에서 필요한 함수들을 가져옵니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. 제공받은 Firebase 구성 정보
const firebaseConfig = {
    apiKey: "AIzaSyCjKLaoXN9j2gW-z4ojdEKJFVh28lbKlJg",
    authDomain: "daily-scoring-app.firebaseapp.com",
    projectId: "daily-scoring-app",
    storageBucket: "daily-scoring-app.appspot.com",
    messagingSenderId: "66313291622",
    appId: "1:66313291622:web:939dc349f3a60870c92aa7",
    measurementId: "G-FZ1BXG66X3"
};

// 3. Firebase 서비스 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// 4. 앱 로직 시작
document.addEventListener('DOMContentLoaded', function() {
    // UI 요소 가져오기
    const authContainer = document.querySelector('.auth-container');
    const mainContainer = document.querySelector('.container');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signupButton = document.getElementById('signup-button');
    const loginButton = document.getElementById('login-button');
    const userInfoDiv = document.getElementById('user-info');

    // onAuthStateChanged: 사용자의 로그인 상태를 실시간으로 감시하는 함수
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // 사용자가 로그인한 경우
            authContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');

            // 사용자 정보 및 로그아웃 버튼 표시
            userInfoDiv.innerHTML = `
                <span>${user.email}</span>
                <button id="logout-button">로그아웃</button>
            `;

            const logoutButton = document.getElementById('logout-button');
            logoutButton.addEventListener('click', () => {
                signOut(auth).catch(error => console.error('로그아웃 오류:', error));
            });
            
            initializeAppForUser(user);

        } else {
            // 사용자가 로그아웃한 경우
            authContainer.classList.remove('hidden');
            mainContainer.classList.add('hidden');
            userInfoDiv.innerHTML = '';
        }
    });

    // 회원가입 버튼 이벤트
    if(signupButton) {
        signupButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    alert('회원가입에 성공했습니다! 이제 로그인해주세요.');
                })
                .catch((error) => {
                    alert(`회원가입 중 오류가 발생했습니다: ${error.message}`);
                });
        });
    }

    // 로그인 버튼 이벤트
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            signInWithEmailAndPassword(auth, email, password)
                .catch((error) => {
                    alert(`로그인 중 오류가 발생했습니다: ${error.message}`);
                });
        });
    }

    function initializeAppForUser(user) {
        const STARTING_SCORE = 29;
        const checklistData = {
            health: { title: "건강", items: [ { id: 'eat_breakfast', text: '아침식사', points: 1 }, { id: 'eat_lunch', text: '점심식사', points: 1 }, { id: 'eat_dinner', text: '저녁식사', points: 1 }, { id: 'late_snack', text: '야식', points: -2 }, { id: 'sugar_drink', text: '당분음료', points: -5 }, { id: 'probiotics', text: '유산균 먹기', points: 1 }, { id: 'supplements', text: '영양제 챙겨먹기', points: 1 }, { id: 'sleep_before_12', text: '전날 12시 이전 수면', points: 6 }, { id: 'wakeup_before_7', text: '7시 이전 기상', points: 6 } ] },
            dopamine: { title: "도파민 디톡스", items: [ { id: 'no_youtube', text: '유튜브', points: -5 }, { id: 'no_game', text: '게임', points: -5 }, { id: 'no_harmful', text: '유해물', points: -5 }, { id: 'no_community', text: '커뮤니티', points: -5 }, { id: 'cold_shower', text: '찬물샤워', points: 2 } ] },
            study: { title: "공부", items: [ { id: 'study_commute_am', text: '등굣길 공부', points: 2 }, { id: 'study_commute_pm', text: '하굣길 공부', points: 2 } ] },
            routines: { title: "데일리 루틴", items: [ { id: 'ticktick_clear', text: 'TickTick 당일 전부 수행', points: 4 }, { id: 'emotion_journal', text: '감정 적기', points: 3 }, { id: 'meditation', text: '호흡 명상', points: 2 }, { id: 'plan_tomorrow', text: '전날 계획 세우기', points: 2 }, { id: 'skin_care', text: '피부관리 루틴', points: 2 }, { id: 'read_before_sleep', text: '잠들기 전 독서', points: 2 }, { id: 'oral_hygiene', text: '구강 위생', points: 2 } ] }
        };

        const scoreDisplay = document.getElementById('score-display');
        const currentDateEl = document.getElementById('current-date');
        const calendarEl = document.getElementById('calendar');
        const monthYearDisplay = document.getElementById('month-year-display');
        
        let today = new Date();
        let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let displayDate = new Date(selectedDate);
        let scoreChart = null; 

        function getScoreColor(score) { const p = Math.max(0, Math.min(100, score)) / 100; return `hsl(${p * 120}, 55%, 48%)`; }
        function updateScoreColor(score) { scoreDisplay.style.backgroundColor = getScoreColor(score); }
        function formatDate(d) { return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; }
        function getDateString(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
        function formatMonthYear(d) { return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; }

        function getStoredData(dateString) {
            const initialData = { score: STARTING_SCORE, checkedItems: {}, exerciseChecked: false, exerciseChoices: [], journalMemo: '', studyHours: 0 };
            Object.keys(checklistData).forEach(catKey => {
                checklistData[catKey].items?.forEach(item => initialData.checkedItems[item.id] = false);
            });
            initialData.checkedItems['daily_journal'] = false;
            const stored = localStorage.getItem(dateString);
            if (stored) { return { ...initialData, ...JSON.parse(stored) }; }
            return initialData;
        }

        function loadStateForDate(dateString) {
            const data = getStoredData(dateString);
            Object.keys(data.checkedItems).forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) checkbox.checked = data.checkedItems[id];
            });
            const mainExerciseBtn = document.getElementById('exercise-main-button');
            const choicesContainer = document.getElementById('exercise-choices');
            mainExerciseBtn.classList.toggle('checked', data.exerciseChecked);
            choicesContainer.classList.toggle('visible', data.exerciseChecked);
            choicesContainer.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('selected', data.exerciseChoices && data.exerciseChoices.includes(btn.dataset.part));
            });
            const journalButton = document.getElementById('journal-toggle-button');
            const journalTextarea = document.getElementById('journal-textarea');
            if(journalButton) {
                journalButton.classList.toggle('checked', data.checkedItems.daily_journal);
                journalTextarea.style.display = data.checkedItems.daily_journal ? 'block' : 'none';
                journalTextarea.value = data.journalMemo || '';
            }
            const studySlider = document.getElementById('study-slider');
            if(studySlider) {
                const studyHours = data.studyHours || 0;
                studySlider.value = studyHours * 2;
                updateStudySliderDisplay(studyHours);
            }
            updateScore();
        }
        
        function updateScore() {
            let score = STARTING_SCORE;
            const data = getStoredData(getDateString(selectedDate));
            Object.keys(data.checkedItems).forEach(id => {
                if (data.checkedItems[id]) {
                    const allItems = [].concat(...Object.values(checklistData).map(c => c.items || []));
                    const item = allItems.find(i => i.id === id);
                    if (item) score += item.points;
                }
            });
            if (data.checkedItems.daily_journal) score += 3;
            if (data.exerciseChecked) score += 6;
            if (data.studyHours) score += data.studyHours * 3;
            score = Math.round(score);
            scoreDisplay.textContent = score;
            updateScoreColor(score);
            data.score = score;
            localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
            renderCalendarScores();
            updateAnalytics();
        }

        function createBlockItemHTML(item) {
            const pointClass = item.points > 0 ? 'points-positive' : 'points-negative';
            const sign = item.points > 0 ? '+' : '';
            return `<div class="block-item"><input type="checkbox" id="${item.id}" data-points="${item.points}"><label for="${item.id}"><span class="item-text">${item.text}</span><span class="item-points ${pointClass}">${sign}${item.points}</span></label></div>`;
        }

        function createElements() {
            document.getElementById('health-card').innerHTML = `<h3>건강</h3><div class="horizontal-blocks">${checklistData.health.items.map(createBlockItemHTML).join('')}</div>`;
            const exerciseCard = document.getElementById('exercise-card');
            const exerciseParts = ['등', '어깨', '가슴', '하체', '이두', '삼두', '전신', '유산소'];
            exerciseCard.innerHTML = `<h3>운동 (+6)</h3> <button id="exercise-main-button">오늘 운동을 기록하려면 클릭</button> <div id="exercise-choices"> ${exerciseParts.map(part => `<button data-part="${part}">${part}</button>`).join('')} </div>`;
            document.getElementById('dopamine-card').innerHTML = `<h3>도파민 디톡스</h3><div class="horizontal-blocks">${checklistData.dopamine.items.map(createBlockItemHTML).join('')}</div>`;
            const studyItemsHTML = checklistData.study.items.map(createBlockItemHTML).join('');
            document.getElementById('study-card').innerHTML = `<h3>공부</h3><div class="horizontal-blocks">${studyItemsHTML}</div><div class="study-slider-container"><input type="range" id="study-slider" min="0" max="16" value="0" step="1"><div class="slider-output"><span id="study-hours-display">0 시간</span> / <span id="study-points-display">+0</span></div></div>`;
            const routineItemsHTML = checklistData.routines.items.map(createBlockItemHTML).join('')
            document.getElementById('routine-card').innerHTML = `<h3>데일리 루틴</h3><div class="journal-wrapper"><button id="journal-toggle-button">일기 적기<span class="points">+3</span></button><textarea id="journal-textarea"></textarea></div><div class="horizontal-blocks" style="margin-top: 10px;">${routineItemsHTML}</div>`;
            addEventListeners();
        }
        
        function addEventListeners() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', () => {
                    const data = getStoredData(getDateString(selectedDate));
                    data.checkedItems[cb.id] = cb.checked;
                    localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
                    updateScore();
                });
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
                    data.exerciseChecked = data.exerciseChoices.length > 0;
                    localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
                    loadStateForDate(getDateString(selectedDate));
                });
            });
            const journalButton = document.getElementById('journal-toggle-button');
            const journalTextarea = document.getElementById('journal-textarea');
            journalButton.addEventListener('click', () => {
                const data = getStoredData(getDateString(selectedDate));
                data.checkedItems.daily_journal = !data.checkedItems.daily_journal;
                localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
                loadStateForDate(getDateString(selectedDate));
            });
            journalTextarea.addEventListener('input', () => {
                const data = getStoredData(getDateString(selectedDate));
                data.journalMemo = journalTextarea.value;
                localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
            });
            const studySlider = document.getElementById('study-slider');
            if(studySlider){
                studySlider.addEventListener('input', () => {
                    const data = getStoredData(getDateString(selectedDate));
                    const hours = parseFloat(studySlider.value) / 2;
                    data.studyHours = hours;
                    localStorage.setItem(getDateString(selectedDate), JSON.stringify(data));
                    updateStudySliderDisplay(hours);
                    updateScore();
                });
            }
        }

        function updateStudySliderDisplay(hours) {
            const hoursDisplay = document.getElementById('study-hours-display');
            const pointsDisplay = document.getElementById('study-points-display');
            const points = Math.round(hours * 3);
            hoursDisplay.textContent = `${hours.toFixed(1)} 시간`;
            pointsDisplay.textContent = `+${points}`;
        }

        function renderCalendarScores() {
            document.querySelectorAll('.day[data-date]').forEach(dayEl => {
                const dateString = dayEl.dataset.date;
                const data = getStoredData(dateString);
                const scoreEl = dayEl.querySelector('.score');
                const hasChecklistActivity = Object.values(data.checkedItems).some(v => v === true);
                const isRecorded = data.score !== STARTING_SCORE || data.exerciseChecked || hasChecklistActivity || data.studyHours > 0;
                if (isRecorded) {
                    scoreEl.textContent = data.score;
                    dayEl.style.backgroundColor = getScoreColor(data.score);
                    dayEl.classList.add('has-score');
                } else {
                    scoreEl.textContent = '';
                    dayEl.style.backgroundColor = '';
                    dayEl.classList.remove('has-score');
                }
            });
        }
    
        function getAverageScore(startDate, endDate) {
            let totalScore = 0; let count = 0; let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const data = getStoredData(getDateString(currentDate));
                const hasChecklistActivity = Object.values(data.checkedItems).some(v => v === true);
                const isRecorded = data.score !== STARTING_SCORE || data.exerciseChecked || hasChecklistActivity || data.studyHours > 0;
                if (isRecorded) { totalScore += data.score; count++; }
                currentDate.setDate(currentDate.getDate() + 1);
            } return count > 0 ? Math.round(totalScore / count) : null;
        }

        function getLast7DaysScores() {
            const scores = []; const labels = []; let currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() - 6);
            for (let i = 0; i < 7; i++) {
                const data = getStoredData(getDateString(currentDate)); 
                const hasChecklistActivity = Object.values(data.checkedItems).some(v => v === true);
                const isRecorded = data.score !== STARTING_SCORE || data.exerciseChecked || hasChecklistActivity || data.studyHours > 0;
                scores.push(isRecorded ? data.score : STARTING_SCORE);
                labels.push(`${currentDate.getMonth() + 1}/${currentDate.getDate()}`);
                currentDate.setDate(currentDate.getDate() + 1);
            } return { scores, labels };
        }

        function updateAnalytics() {
            const today = new Date(selectedDate); const currentScore = getStoredData(getDateString(today)).score;
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const monthlyAvg = getAverageScore(monthStart, monthEnd);
            const monthlyCompEl = document.getElementById('monthly-avg-comp');
            if (monthlyAvg !== null) { const diff = currentScore - monthlyAvg; monthlyCompEl.innerHTML = `이번 달 평균(${monthlyAvg}점)보다 <strong class="${diff >= 0 ? 'positive' : 'negative'}">${Math.abs(diff)}점 ${diff >= 0 ? '높아요' : '낮아요'}</strong>`;
            } else { monthlyCompEl.textContent = '이번 달 평균 데이터 부족'; }
            const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() - 6);
            const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
            const weeklyAvg = getAverageScore(weekStart, weekEnd);
            const weeklyCompEl = document.getElementById('weekly-avg-comp');
            if (weeklyAvg !== null) { const diff = currentScore - weeklyAvg; weeklyCompEl.innerHTML = `지난주 평균(${weeklyAvg}점)보다 <strong class="${diff >= 0 ? 'positive' : 'negative'}">${Math.abs(diff)}점 ${diff >= 0 ? '높아요' : '낮아요'}</strong>`;
            } else { weeklyCompEl.textContent = '지난주 평균 데이터 부족'; }
            const { scores, labels } = getLast7DaysScores();
            const ctx = document.getElementById('score-chart').getContext('2d');
            const avg7days = scores.reduce((a, b) => a + b, 0) / scores.length;
            const pointColors = scores.map((score, index) => {
                if (index === 6) { return score >= avg7days ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'; }
                return 'rgba(74, 144, 226, 0.8)';
            });
            if (scoreChart) { scoreChart.destroy(); }
            scoreChart = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{
                label: '최근 7일 점수', data: scores, borderColor: 'rgba(74, 144, 226, 0.5)', backgroundColor: 'rgba(74, 144, 226, 0.1)',
                pointBackgroundColor: pointColors, pointBorderColor: pointColors, pointRadius: 4, pointHoverRadius: 6, tension: 0.2, fill: true,
            }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } } } });
        }

        function renderCalendar() {
            const year = displayDate.getFullYear(), month = displayDate.getMonth();
            monthYearDisplay.textContent = formatMonthYear(displayDate); calendarEl.innerHTML = '';
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            ['일','월','화','수','목','금','토'].forEach(name => { const dayNameEl = document.createElement('div'); dayNameEl.className = 'day-name'; dayNameEl.textContent = name; calendarEl.appendChild(dayNameEl); });
            for (let i = 0; i < firstDayOfMonth; i++) calendarEl.appendChild(document.createElement('div'));
            for (let i = 1; i <= daysInMonth; i++) {
                const dayEl = document.createElement('div'); const dayDate = new Date(year, month, i);
                const dateString = getDateString(dayDate); dayEl.className = 'day'; dayEl.dataset.date = dateString;
                dayEl.innerHTML = `<span class="date-num">${i}</span><span class="score"></span>`;
                if (dateString === getDateString(selectedDate)) dayEl.classList.add('selected');
                if (dateString === getDateString(new Date())) dayEl.classList.add('today');
                dayEl.addEventListener('click', () => { selectedDate = dayDate; currentDateEl.textContent = formatDate(selectedDate);
                    document.querySelectorAll('.day.selected').forEach(d => d.classList.remove('selected'));
                    dayEl.classList.add('selected'); loadStateForDate(dateString);
                });
                calendarEl.appendChild(dayEl);
            }
            renderCalendarScores();
        }
        
        function initializeApp() {
            currentDateEl.textContent = formatDate(selectedDate);
            createElements();
            renderCalendar();
            loadStateForDate(getDateString(selectedDate));
            document.getElementById('prev-month').addEventListener('click', () => { displayDate.setMonth(displayDate.getMonth() - 1); renderCalendar(); });
            document.getElementById('next-month').addEventListener('click', () => { displayDate.setMonth(displayDate.getMonth() + 1); renderCalendar(); });
            updateAnalytics();
        }

        initializeApp();
    } // End of initializeAppForUser
});