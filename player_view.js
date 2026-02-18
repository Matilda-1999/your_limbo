import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { UI } from './core/renderUI.js';
import { Character } from './core/Character.js';

const firebaseConfig = {
    apiKey: "AIzaSyAOd24AzDmA609KAaa_4frTMnAeY8mJrXM",
    authDomain: "raid-simulator-1999.firebaseapp.com",
    databaseURL: "https://raid-simulator-1999-default-rtdb.firebaseio.com",
    projectId: "raid-simulator-1999",
    storageBucket: "raid-simulator-1999.firebasestorage.app",
    messagingSenderId: "112905026016",
    appId: "1:112905026016:web:419f84388bae3e6291d385",
    measurementId: "G-P176XFZWH2",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const DOM = {
    mapContainer: document.getElementById("mapGridContainer"),
    allyDisplay: document.getElementById("allyCharacters"),
    enemyDisplay: document.getElementById("enemyCharacters"),
    logDisplay: document.getElementById("playerBattleLog"),
};

const reconstructCharacter = (data) => {
    const char = new Character(data.name, data.type, data.job, data.maxHp);
    Object.assign(char, data);
    return char;
};

const createEnemySpectatorCard = (character) => {
    const card = document.createElement("div");
    card.className = "character-stats enemy-spectator";
    
    card.innerHTML = `
        <p>
            <span class="material-icons-outlined" style="font-size: 1.1em; color: var(--color-accent-red);">
                sentiment_very_dissatisfied
            </span>
            <strong>${character.name}</strong>
        </p>
        <p>속성: <strong style="color: var(--color-primary-gold-lighter);">${character.type}</strong></p>
        <div class="status-effects" style="margin-top: 8px;">
            <p style="font-size: 0.9em; margin-bottom: 4px;">상태 이상 및 강화:</p>
            ${character.buffs.length > 0 ? `<p style="color: #4db8ff;">버프: ${character.buffs.map(b => `${b.name}(${b.turnsLeft}턴)`).join(", ")}</p>` : ""}
            ${character.debuffs.length > 0 ? `<p style="color: #ff4d4d;">디버프: ${character.debuffs.map(d => `${d.name}(${d.turnsLeft}턴)`).join(", ")}</p>` : ""}
            ${character.buffs.length === 0 && character.debuffs.length === 0 ? '<p style="color: #888;">특이사항 없음</p>' : ""}
        </div>
    `;
    return card;
};

// Firebase 데이터 실시간 감시
const battleRef = ref(db, 'liveBattle/currentSession');
onValue(battleRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // 1. 데이터 복원 (아군과 적군 모두 Character 인스턴스로 변환)
    const allies = (data.allyCharacters || []).map(reconstructCharacter);
    const enemies = (data.enemyCharacters || []).map(reconstructCharacter);
    const objects = data.mapObjects || [];

    // 2. 맵 그리드 렌더링
    UI.renderMapGrid(
        DOM.mapContainer, 
        allies, 
        enemies, 
        objects, 
        null, 
        data.mapWidth || 5, 
        data.mapHeight || 5
    );

    // 3. 아군 카드 리스트 렌더링 (모든 정보 노출)
    DOM.allyDisplay.innerHTML = "";
    allies.forEach(char => {
        DOM.allyDisplay.appendChild(UI.createCharacterCard(char, "ally"));
    });

    // 4. 적군 카드 리스트 렌더링 (속성 및 상태만 노출)
    DOM.enemyDisplay.innerHTML = "";
    enemies.forEach(char => {
        DOM.enemyDisplay.appendChild(createEnemySpectatorCard(char));
    });
    
});

// 플레이어 뷰어 연동
const logRef = ref(db, 'liveBattle/currentSession/battleLog');

onValue(logRef, (snapshot) => {
    if (!DOM.logDisplay) return;

    const logs = snapshot.val();

    // 1. 데이터가 아예 없거나 빈 객체인 경우 처리
    if (!logs || Object.keys(logs).length === 0) {
        DOM.logDisplay.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">전투 기록이 없습니다.</div>';
        return;
    }

    // 2. 화면 초기화 후 정렬된 로그 출력
    DOM.logDisplay.innerHTML = ""; 

    // Firebase의 push ID 객체를 배열로 변환 후 시간순 정렬
    const sortedLogs = Object.values(logs).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sortedLogs.forEach(logData => {
        if (logData && logData.message) {
            const entry = document.createElement("div");
            entry.className = "log-entry"; // CSS 클래스가 있다면 활용
            entry.style.marginBottom = "10px";
            entry.style.borderBottom = "1px solid rgba(212, 175, 55, 0.1)";
            entry.style.paddingBottom = "6px";
            entry.style.lineHeight = "1.5";
            
            // 시뮬레이터에서 보낸 HTML 구조(pre, color 등)를 그대로 반영
            entry.innerHTML = logData.message; 
            DOM.logDisplay.appendChild(entry);
        }
    });
    
    // 3. 새 로그가 추가될 때 하단으로 자동 스크롤
    setTimeout(() => {
        DOM.logDisplay.scrollTo({
            top: DOM.logDisplay.scrollHeight,
            behavior: 'smooth' // 부드러운 스크롤 효과
        });
    }, 50);

}, (error) => {
    console.error("로그 데이터 불러오기 실패:", error);
    if (DOM.logDisplay) {
        DOM.logDisplay.innerHTML = '<div style="color: #ff4444;">데이터 로드 중 오류가 발생했습니다.</div>';
    }
});
