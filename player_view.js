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

 // 4. 적군 카드 리스트 렌더링 (속성 및 상태만 노출)
    DOM.enemyDisplay.innerHTML = "";
    enemies.forEach(char => {
        DOM.enemyDisplay.appendChild(createEnemySpectatorCard(char));
    }); 
});

// 2. 전투 로그 실시간 감시 (새로 추가된 로직)
const logRef = ref(db, 'liveBattle/currentSession/battleLog');
onValue(logRef, (snapshot) => {
    const logs = snapshot.val();
    if (!logs || !DOM.logDisplay) {
        if (DOM.logDisplay) DOM.logDisplay.innerHTML = "";
        return;
    }

    DOM.logDisplay.innerHTML = ""; 
    Object.values(logs).forEach(logData => {
        const entry = document.createElement("div");
        entry.style.marginBottom = "5px";
        entry.innerHTML = logData.message; 
        DOM.logDisplay.appendChild(entry);
    });
    
    // 최신 로그 위치로 자동 스크롤
    DOM.logDisplay.scrollTop = DOM.logDisplay.scrollHeight;
});
