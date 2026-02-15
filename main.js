/**
 * main.js
 * 모든 모듈과 특수 기믹(앵콜, 이중창, 맵 축소)을 통합한 메인 실행 파일입니다.
 */

// 1. 모듈 수입
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

import { Character } from "./core/Character.js";
import { BattleEngine } from "./core/BattleEngine.js";
import { Utils } from "./core/Utils.js";
import { UI } from "./core/renderUI.js";

import { SKILLS } from "./data/skills.js";
import { MONSTER_SKILLS } from "./data/monsterSkills.js";
import { MONSTER_TEMPLATES } from "./data/monsterTemplates.js";
import { MAP_CONFIGS } from "./data/mapConfigs.js";

// 2. Firebase 설정
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

// 3. 전역 상태 관리
let state = {
  allyCharacters: [],
  enemyCharacters: [],
  mapObjects: [],
  characterPositions: {},
  currentTurn: 0,
  isBattleStarted: false,
  selectedMapId: "A-1",
  playerActionsQueue: [],
  actedAlliesThisTurn: [],
  selectedAction: null,
  enemyPreviewAction: null,
  mapWidth: 5,
  mapHeight: 5,
  minionsWipedTurn: null,
  mapShrinkState: 0,
};

// 4. HTML 요소 참조
const DOM = {
  allyDisplay: document.getElementById("allyCharacters"),
  enemyDisplay: document.getElementById("enemyCharacters"),
  mapContainer: document.getElementById("mapGridContainer"),
  battleLog: document.getElementById("battleLog"),
  skillArea: document.getElementById("skillSelectionArea"),
  actingName: document.getElementById("currentActingCharName"),
  skillButtons: document.getElementById("availableSkills"),
  moveButtons: document.getElementById("movementControlsArea"),
  description: document.getElementById("skillDescriptionArea"),
  targetName: document.getElementById("selectedTargetName"),
  confirmBtn: document.getElementById("confirmActionButton"),
  startBtn: document.getElementById("startButton"),
  executeBtn: document.getElementById("executeTurnButton"),
  allySelectDiv: document.getElementById("allySelectionButtons"),
};

const log = (msg) => UI.logToBattleLog(DOM.battleLog, msg);

// 6. 전투 준비 및 캐릭터 관리
function addCharacterAtPos(templateId, pos) {
  if (!pos) return;
  const template = MONSTER_TEMPLATES[templateId];
  if (!template) return;
  const monster = new Character(template.name, template.type, null);
  Object.assign(monster, {
    maxHp: template.maxHp,
    currentHp: template.maxHp,
    atk: template.atk,
    matk: template.matk,
    def: template.def,
    mdef: template.mdef,
    skills: template.skills,
    gimmicks: template.gimmicks,
    posX: pos.x,
    posY: pos.y,
  });
  state.enemyCharacters.push(monster);
  state.characterPositions[`${pos.x},${pos.y}`] = monster.id;
}

function loadSelectedMap() {
  if (state.isBattleStarted)
    return alert("전투 중에는 맵을 변경할 수 없습니다.");
  const mapId = document.getElementById("mapSelect").value;
  const config = MAP_CONFIGS[mapId];

  state.selectedMapId = mapId;
  state.mapWidth = config.width;
  state.mapHeight = config.height;
  state.enemyCharacters = [];
  state.characterPositions = {};
  state.mapShrinkState = 0;
  state.minionsWipedTurn = null;

  config.enemies.forEach((e) => {
    addCharacterAtPos(e.templateId, e.pos);
  });

  log(`\n<pre>${config.flavorText}</pre>\n`);
  syncUI();
}

function addCharacter(team) {
  const nameInput = document.getElementById("charName");
  const name = nameInput.value || `${team}${Date.now().toString().slice(-3)}`;
  const type = document.getElementById("charType").value;
  const job = document.getElementById("charJob").value;
  const hp = parseInt(document.getElementById("charCurrentHp").value) || null;

  const newChar = new Character(name, type, job, hp);
  const emptyCell = Utils.getRandomEmptyCell(
    state.mapWidth,
    state.mapHeight,
    state.characterPositions
  );

  if (emptyCell) {
    newChar.posX = emptyCell.x;
    newChar.posY = emptyCell.y;
    state.characterPositions[`${emptyCell.x},${emptyCell.y}`] = newChar.id;

    if (team === "ally") state.allyCharacters.push(newChar);
    else state.enemyCharacters.push(newChar);

    nameInput.value = "";
    syncUI();
  } else {
    alert("맵에 빈 공간이 없습니다.");
  }
}

function deleteChar(id, team) {
  const list = team === "ally" ? state.allyCharacters : state.enemyCharacters;
  const idx = list.findIndex((c) => c.id === id);
  if (idx > -1) {
    delete state.characterPositions[`${list[idx].posX},${list[idx].posY}`];
    list.splice(idx, 1);
    syncUI();
  }
}

// 7. 전투 흐름 제어
function startBattle() {
  if (state.allyCharacters.length === 0 || state.enemyCharacters.length === 0)
    return alert("캐릭터가 부족합니다.");
  state.isBattleStarted = true;
  state.currentTurn = 0;
  DOM.startBtn.style.display = "none";
  log("\n【전투 시작】\n");
  prepareNextTurnCycle();
}

function prepareNextTurnCycle() {
  state.currentTurn++;
  state.actedAlliesThisTurn = [];
  state.playerActionsQueue = [];
  DOM.executeBtn.style.display = "none";
  log(`\n --- ${state.currentTurn} 턴 행동 선택 시작 --- \n`);

  const boss = state.enemyCharacters.find(e => e.isAlive && (e.name.includes("테르모르") || e.name.includes("카르나블룸")));
    if (boss && boss.skills && boss.skills.length > 0) {
        // 보스의 첫 번째 스킬 혹은 특정 로직으로 스킬 선택
        const skillId = boss.skills[0]; 
        const skillData = MONSTER_SKILLS[skillId]; // monsterSkills.js에서 데이터 참조
        
        if (skillData) {
            state.enemyPreviewAction = { skillId, targetArea: [] }; // 예고 상태 저장
            // 스킬에 정의된 script(대사)를 로그에 출력
            log(`<b>[예고] ${boss.name}:</b> "${skillData.script || "..."}"`); 
        }
    }

  promptAllySelection();
  syncUI();
}

function promptAllySelection() {
  DOM.allySelectDiv.innerHTML = "";
  DOM.skillArea.style.display = "none";

  const available = state.allyCharacters.filter(
    (a) => a.isAlive && !state.actedAlliesThisTurn.includes(a.id)
  );

  if (available.length === 0) {
    DOM.executeBtn.style.display = "block";
    log("모든 아군의 행동 예약이 완료되었습니다. [턴 실행]을 눌러주세요.");
  } else {
    DOM.allySelectDiv.style.display = "block";
    available.forEach((ally) => {
      const btn = document.createElement("button");
      btn.className = "button";
      btn.style.margin = "5px";
      btn.textContent = `${ally.name} 행동 선택`;
      btn.onclick = () => {
        console.log("선택된 캐릭터:", ally); // 디버깅용
        startCharacterAction(ally);
      };

      DOM.allySelectDiv.appendChild(btn);
    });
  }
}

function startCharacterAction(char) {
  if (!char) return;

  DOM.allySelectDiv.style.display = "none";
  DOM.skillArea.style.display = "block";
  DOM.actingName.textContent = char.name;
  DOM.skillButtons.innerHTML = "";
  DOM.targetName.textContent = "대상 필요";
  DOM.confirmBtn.style.display = "none";
  state.selectedAction = null;

  const allSkillIds = Object.keys(SKILLS);

  allSkillIds.forEach((skillId) => {
    const skill = SKILLS[skillId];
    if (!skill) return;

    const btn = document.createElement("button");
    btn.textContent = skill.name;

    // lastUsed가 0이 아닐 때(즉, 한 번이라도 썼을 때)만 쿨다운을 계산합니다.
    const lastUsed = char.lastSkillTurn ? char.lastSkillTurn[skillId] || 0 : 0;
    const isOnCooldown =
      skill.cooldown &&
      lastUsed !== 0 &&
      state.currentTurn - lastUsed < skill.cooldown;

    if (isOnCooldown) {
      btn.disabled = true;
      btn.textContent += ` (${
        skill.cooldown - (state.currentTurn - lastUsed)
      }턴)`;
    }

    btn.onclick = () => {
      state.selectedAction = {
        type: "skill",
        skill,
        caster: char,
        targetId: null,
      };
      UI.renderSkillDescription(DOM.description, skill);

      // 자가 타겟팅 또는 전체 타겟팅 스킬 처리
      if (
        skill.targetSelection === "self" ||
        (skill.targetType && skill.targetType.startsWith("all_"))
      ) {
        state.selectedAction.targetId = char.id;
        DOM.targetName.textContent = "즉시 발동";
        DOM.confirmBtn.style.display = "block";
      } else {
        DOM.confirmBtn.style.display = "none";
        DOM.targetName.textContent = "대상을 선택하세요";
      }
      syncUI();
    };
    DOM.skillButtons.appendChild(btn);
  });

  // 이동 컨트롤 생성
  renderMovementControls(char);
}

// 이동 컨트롤 렌더링 함수
function renderMovementControls(char) {
  DOM.moveButtons.innerHTML = "<h4>이동(8방향)</h4>";
  const directions = [
    { d: "↖", x: -1, y: -1 },
    { d: "↑", x: 0, y: -1 },
    { d: "↗", x: 1, y: -1 },
    { d: "←", x: -1, y: 0 },
    { d: "→", x: 1, y: 0 },
    { d: "↙", x: -1, y: 1 },
    { d: "↓", x: 0, y: 1 },
    { d: "↘", x: 1, y: 1 },
  ];

  directions.forEach((dir, index) => {
    const btn = document.createElement("button");
    btn.textContent = dir.d;
    btn.style.width = "50px";
    btn.style.height = "50px";
    btn.style.margin = "2px";
    btn.style.fontSize = "1.2em";

    const targetX = char.posX + dir.x;
    const targetY = char.posY + dir.y;

    const isOutOfBounds =
      targetX < 0 ||
      targetX >= state.mapWidth ||
      targetY < 0 ||
      targetY >= state.mapHeight;
    const isOccupied = state.characterPositions[`${targetX},${targetY}`];

    if (isOutOfBounds || isOccupied) {
      btn.disabled = true;
      btn.style.opacity = "0.3";
      btn.style.cursor = "not-allowed";
    }

    btn.onclick = () => {
      state.selectedAction = {
        type: "move",
        caster: char,
        moveDelta: { dx: dir.x, dy: dir.y },
      };
      DOM.targetName.textContent = `이동 예약: (${targetX}, ${targetY})`;
      DOM.confirmBtn.style.display = "block";
      syncUI();
    };

    DOM.moveButtons.appendChild(btn);
    if ((index + 1) % 3 === 0)
      DOM.moveButtons.appendChild(document.createElement("br"));
  });
}

function selectTarget(targetId) {
  if (!state.selectedAction || state.selectedAction.type !== "skill") return;
  const target = Utils.findCharacterById(
    targetId,
    state.allyCharacters,
    state.enemyCharacters,
    state.mapObjects
  );
  if (!target || !target.isAlive) return;

  state.selectedAction.targetId = targetId;
  DOM.targetName.textContent = target.name;
  DOM.confirmBtn.style.display = "block";
  syncUI();
}

function confirmAction() {
  if (!state.selectedAction) return;
  state.playerActionsQueue.push(state.selectedAction);
  state.actedAlliesThisTurn.push(state.selectedAction.caster.id);
  state.selectedAction = null;
  promptAllySelection();
  syncUI();
}

지우 님, 올려주신 코드의 흐름은 의도하신 대로 (2) 아군 행동 완료 후 (3) 적군 행동으로 이어지는 순서가 아주 잘 잡혔습니다. 다만, 현재 코드에 중복 선언과 오타가 섞여 있어 이대로 실행하면 다시 에러가 날 수 있습니다.

아래 코드에서 중복된 부분을 제거하고 깔끔하게 정리해 드릴 테니, 이 버전으로 executeBattleTurn 함수를 교체해 주세요.

🛠️ 수정 및 정리된 executeBattleTurn
JavaScript
async function executeBattleTurn() {
  DOM.executeBtn.style.display = "none";
  log(`\n\n☂︎  지금부터 5 분 동안 행동을 게시해 주세요.\n\n`); // 아군 턴임을 명시

  // --- (2) 아군 행동 실행 (Player Phase) ---
  for (const action of state.playerActionsQueue) {
    const { caster, skill, targetId, moveDelta } = action;
    if (!caster.isAlive) continue;

    if (action.type === "skill") {
      const target = Utils.findCharacterById(targetId, state.allyCharacters, state.enemyCharacters, state.mapObjects);
      log(`✦ ${caster.name}, [${skill.name}] 시전.`);
      
      skill.execute(caster, target, state.allyCharacters, state.enemyCharacters, log, {
        currentTurn: state.currentTurn,
        applyHeal: BattleEngine.applyHeal,
        calculateDamage: (a, d, p, t, o) => BattleEngine.calculateDamage(a, d, p, t, {
          ...o, gimmickData: MONSTER_SKILLS, parseSafeCoords: Utils.parseSafeCoords
        }),
        displayCharacters: syncUI,
        mapObjects: state.mapObjects
      });
      caster.lastSkillTurn[skill.id] = state.currentTurn;
    } else if (action.type === "move") {
      const oldPos = `${caster.posX},${caster.posY}`;
      delete state.characterPositions[oldPos];
      caster.posX += moveDelta.dx;
      caster.posY += moveDelta.dy;
      state.characterPositions[`${caster.posX},${caster.posY}`] = caster.id;
      log(`✦ ${caster.name}, (${caster.posX},${caster.posY})로 이동.`);
    }
    syncUI();
    await new Promise((r) => setTimeout(r, 600));
  }

  // --- (3) 적군 행동 실행 (Enemy Phase) ---
  resolveMinionGimmicks();

  // [수정] 중복 선언 제거 및 보스 이름 찾기 통합
  const activeBoss = state.enemyCharacters.find(
    (e) => e.isAlive && (e.name.includes("테르모르") || e.name.includes("카르나블룸"))
  );
  const turnOwner = activeBoss ? activeBoss.name : "적군";
  log(`\n\n☂︎ ${turnOwner}의 턴.\n\n`);

  for (const enemy of state.enemyCharacters.filter(e => e.isAlive)) {
    // performEnemyAction 내부에서 예고된 스킬이 실행되도록 설정되어 있어야 합니다.
    await performEnemyAction(enemy); 
    syncUI();
    await new Promise(r => setTimeout(r, 600));
  }

  // --- 턴 마무리 (상태이상 감소 및 승패 판정) ---
  [...state.allyCharacters, ...state.enemyCharacters].forEach((c) => {
    if (c.isAlive) {
      c.buffs.forEach((b) => { if (!b.unremovable) b.turnsLeft--; });
      c.debuffs.forEach((d) => d.turnsLeft--);
      c.buffs = c.buffs.filter((b) => b.turnsLeft > 0 || b.unremovable);
      c.debuffs = c.debuffs.filter((d) => d.turnsLeft > 0);
    }
  });

  checkMapShrink();

  const result = BattleEngine.checkBattleEnd(state.allyCharacters, state.enemyCharacters);
  if (result) {
    log(`\n\n【 전투 종료: ${result === "WIN" ? "승리" : "패배"} 】`);
    state.isBattleStarted = false;
    DOM.startBtn.style.display = "block";
  } else {
    // 다시 (1)단계인 '적군 예고'가 포함된 prepareNextTurnCycle로 이동합니다.
    prepareNextTurnCycle();
  }
}

// --- 기믹 함수들 ---
function resolveMinionGimmicks() {
  if (!state.selectedMapId || !state.selectedMapId.startsWith("B")) return;
  const livingClowns = state.enemyCharacters.filter(
    (e) => e.isAlive && e.name === "클라운"
  );
  const livingPierrots = state.enemyCharacters.filter(
    (e) => e.isAlive && e.name === "피에로"
  );
  const boss = state.enemyCharacters.find(
    (e) => e.name === "카르나블룸" && e.isAlive
  );
  if (!boss) return;
  if (livingClowns.length === 0 && livingPierrots.length === 0) {
    if (!state.minionsWipedTurn) state.minionsWipedTurn = state.currentTurn;
    if (state.currentTurn >= state.minionsWipedTurn + 2) {
      log('✦기믹✦ "나의 아이들은 아직 무대를 떠날 준비가 되지 않은 모양이야."');
      addCharacterAtPos(
        "Clown",
        Utils.getRandomEmptyCell(
          state.mapWidth,
          state.mapHeight,
          state.characterPositions
        )
      );
      addCharacterAtPos(
        "Pierrot",
        Utils.getRandomEmptyCell(
          state.mapWidth,
          state.mapHeight,
          state.characterPositions
        )
      );
      state.minionsWipedTurn = null;
    }
  }
  if (
    (livingClowns.length > 0 && livingPierrots.length === 0) ||
    (livingClowns.length === 0 && livingPierrots.length > 0)
  ) {
    log("✦기믹✦ 남겨진 인형들이 외로움에 폭주합니다.");
    [...livingClowns, ...livingPierrots].forEach((m) => {
      if (!m.hasBuff("duet_enrage"))
        m.addBuff("duet_enrage", "[폭주]", 99, { atk_boost_multiplier: 1.5 });
    });
  }
}

function checkMapShrink() {
  if (state.selectedMapId !== "B-2") return;
  const boss = state.enemyCharacters.find(
    (e) => e.name === "카르나블룸" && e.isAlive
  );
  if (!boss) return;
  const hpPercent = (boss.currentHp / boss.maxHp) * 100;
  if (hpPercent <= 20 && state.mapShrinkState < 2) {
    state.mapShrinkState = 2;
    log("✦기믹✦ [최종 막]: 무대가 극도로 좁아집니다!");
  } else if (hpPercent <= 50 && state.mapShrinkState < 1) {
    state.mapShrinkState = 1;
    log("✦기믹✦ [제 2막]: 무대가 좁아지기 시작합니다.");
  }
}

async function performEnemyAction(enemy) {
  const provoke = enemy.debuffs.find((d) => d.id === "provoked");
  let target = provoke
    ? Utils.findCharacterById(provoke.effect.targetId, state.allyCharacters)
    : null;
  if (!target || !target.isAlive) {
    target = state.allyCharacters.find((a) => a.isAlive);
  }
  if (target) {
    if (provoke)
      log(`✦도발✦ ${enemy.name}이(가) ${target.name}에게 고정됩니다.`);
    const dmg = BattleEngine.calculateDamage(enemy, target, 1.0, "physical");
    target.takeDamage(
      dmg,
      log,
      enemy,
      state.allyCharacters,
      state.enemyCharacters,
      {
        applyHeal: BattleEngine.applyHeal,
      }
    );
  }
}

// 9. 초기화 및 전역 등록
document.addEventListener("DOMContentLoaded", () => {
  syncUI();
});

function syncUI() {
  UI.renderMapGrid(
    DOM.mapContainer,
    state.allyCharacters,
    state.enemyCharacters,
    state.mapObjects,
    state.enemyPreviewAction,
    state.mapWidth,
    state.mapHeight
  );

  DOM.allyDisplay.innerHTML = "";
  state.allyCharacters.forEach((char) => {
    const isSelected = state.selectedAction?.targetId === char.id;
    const card = UI.createCharacterCard(
      char,
      "ally",
      isSelected,
      state.isBattleStarted ? null : (id) => deleteChar(id, "ally")
    );
    card.onclick = () => selectTarget(char.id);
    DOM.allyDisplay.appendChild(card);
  });

  DOM.enemyDisplay.innerHTML = "";
  state.enemyCharacters.forEach((char) => {
    const isSelected = state.selectedAction?.targetId === char.id;
    const card = UI.createCharacterCard(char, "enemy", isSelected);
    card.onclick = () => selectTarget(char.id);
    DOM.enemyDisplay.appendChild(card);
  });

  updateFirebaseState();
}

async function updateFirebaseState() {
  try {
    const battleRef = ref(db, "liveBattle/currentSession");
    await set(battleRef, {
      allyCharacters: state.allyCharacters,
      enemyCharacters: state.enemyCharacters,
      mapObjects: state.mapObjects,
      currentTurn: state.currentTurn,
      mapWidth: state.mapWidth,
      mapHeight: state.mapHeight,
      isBattleStarted: state.isBattleStarted,
      lastUpdateTime: Date.now(),
    });
  } catch (e) {
    console.error("관전자 데이터 전송 실패:", e);
  }
}

// HTML의 onclick에서 호출할 수 있도록 window 객체에 할당
window.loadSelectedMap = loadSelectedMap;
window.addCharacter = addCharacter;
window.startBattle = startBattle;
window.confirmAction = confirmAction;
window.executeBattleTurn = executeBattleTurn;
window.syncUI = syncUI;
