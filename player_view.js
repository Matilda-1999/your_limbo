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

    const data = snapshot.val();

    // 1. 데이터가 없으면 안내 문구 표시
    if (!data) {
        DOM.logDisplay.innerHTML = '<p style="color: #888; text-align: center;">전투 기록 대기 중...</p>';
        return;
    }

    // 2. 화면을 비우고 데이터를 하나씩 추가
    DOM.logDisplay.innerHTML = "";

    // Firebase의 push 객체를 배열로 변환 (순서 보장)
    const logs = Object.values(data);

    logs.forEach(log => {
        // log 자체가 문자열이거나, log.message에 내용이 있는 경우 모두 대응
        const message = (typeof log === 'string') ? log : (log.message || "");
        
        if (message) {
            const div = document.createElement("div");
            div.style.marginBottom = "10px";
            div.style.whiteSpace = "pre-wrap";
            div.innerHTML = message;
            DOM.logDisplay.appendChild(div);
        }
    });

    // 3. 스크롤을 항상 최하단으로 이동
    DOM.logDisplay.scrollTop = DOM.logDisplay.scrollHeight;
},

    // --- 에러 발생 시 처리 로직 ---
    (error) => {
    console.error("Firebase 데이터 로드 에러:", error);
    if (DOM.logDisplay) {
        DOM.logDisplay.innerHTML = `
            <div style="color: #ff4444; text-align: center; padding: 20px; border: 1px solid #ff4444;">
                <p>통신 기구의 이상으로 전투 기록을 불러오지 못했습니다.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
});
