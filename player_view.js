// player_view.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { UI } from './ui/renderUI.js';

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
    battleLog: document.getElementById("battleLog")
};

// Firebase 데이터 실시간 감시
const battleRef = ref(db, 'liveBattle/currentSession');
onValue(battleRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // 1. 맵 그리드 렌더링
    UI.renderMapGrid(DOM.mapContainer, data.allyCharacters, data.enemyCharacters, data.mapObjects, null, data.mapWidth, data.mapHeight);

    // 2. 아군 카드 리스트 렌더링
    DOM.allyDisplay.innerHTML = "";
    data.allyCharacters.forEach(char => {
        DOM.allyDisplay.appendChild(UI.createCharacterCard(char, "ally"));
    });

    // 3. 적군 카드 리스트 렌더링
    DOM.enemyDisplay.innerHTML = "";
    data.enemyCharacters.forEach(char => {
        DOM.enemyDisplay.appendChild(UI.createCharacterCard(char, "enemy"));
    });
});
