/**
 * main.js
 * 모든 모듈과 특수 기믹(앵콜, 이중창, 맵 축소)을 통합한 메인 실행 파일입니다.
 */

// 1. 모듈 수입
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
  if (state.isBattleStarted) return alert("전투 중에는 맵을 변경할 수 없습니다.");
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
  const emptyCell = Utils.getRandomEmptyCell(state.mapWidth, state.mapHeight, state.characterPositions);

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

  const config = MAP_CONFIGS[state.selectedMapId];
  if (config) {
    log(`\n<pre>${config.flavorText}</pre>\n`);
  }
  prepareNextTurnCycle();
}

function prepareNextTurnCycle() {
  state.currentTurn++;
  state.actedAlliesThisTurn = [];
  state.playerActionsQueue = [];
  DOM.executeBtn.style.display = "none";

  const boss = state.enemyCharacters.find(e => e.isAlive && (e.name.includes("테르모르") || e.name.includes("카르나블룸")));

  if (boss) {
    const available = [...(boss.skills || []), ...(boss.gimmicks || [])];
    const nextSkillId = available[Math.floor(Math.random() * available.length)];
    state.enemyPreviewAction = { skillId: nextSkillId };

    const skillData = MONSTER_SKILLS[nextSkillId];
    if (skillData) {
      console.group(`%c[턴 ${state.currentTurn}] 적군 행동 예고`, 'color: #ff4d4d; font-weight: bold;');
      console.log(`시전자: ${boss.name}`);
      console.log(`예고 스킬: ${skillData.name} (${nextSkillId})`);
      console.log(`타격 범위(hitArea):`, skillData.hitArea || "범위 정보 없음");
      console.groupEnd();

      log(`\n\n ☂︎ ${state.currentTurn} 턴을 시작합니다.\n\n`);
      const scriptText = skillData.script || `\n<pre>${skillData.name} 태세를 취합니다.</pre>\n`;
      log(`${scriptText}`);
    }
    log(`\n\n ☂︎ 전원, 5 분 동안 행동해 주세요. \n\n`);
  }

  promptAllySelection();
  syncUI();
}

function promptAllySelection() {
  DOM.allySelectDiv.innerHTML = "";
  DOM.skillArea.style.display = "none";

  const available = state.allyCharacters.filter((a) => a.isAlive && !state.actedAlliesThisTurn.includes(a.id));

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
      btn.onclick = () => startCharacterAction(ally);
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

  Object.keys(SKILLS).forEach((skillId) => {
    const skill = SKILLS[skillId];
    if (!skill) return;
    const btn = document.createElement("button");
    btn.textContent = skill.name;
    const lastUsed = char.lastSkillTurn ? char.lastSkillTurn[skillId] || 0 : 0;
    const isOnCooldown = skill.cooldown && lastUsed !== 0 && state.currentTurn - lastUsed < skill.cooldown;

    if (isOnCooldown) {
      btn.disabled = true;
      btn.textContent += ` (${skill.cooldown - (state.currentTurn - lastUsed)}턴)`;
    }

    btn.onclick = () => {
    state.selectedAction = { type: "skill", skill, caster: char, targetId: null };
    UI.renderSkillDescription(DOM.description, skill);

    if (skill.targetSelection === "self" || skill.targetType === "all_allies") {
        state.selectedAction.targetId = char.id;
        DOM.targetName.textContent = "즉시 발동 (자신)";
        DOM.confirmBtn.style.display = "block";
    } else {
        DOM.confirmBtn.style.display = "none";
        
        // 스킬의 targetSelection 값에 따라 안내 텍스트 변경
        let targetText = "대상을 선택하세요";
        if (skill.targetSelection === "enemy") {
            targetText += " (적군)";
        } else if (skill.targetSelection === "ally") {
            targetText += " (아군)";
        } else if (skill.targetSelection === "ally_or_self") {
            targetText += " (아군 혹은 자신)";
        } else if (skill.targetSelection === "single_ally_or_gimmick") {
            targetText += " (아군 혹은 오브젝트)";
        }
        
        DOM.targetName.textContent = targetText;
    }
    syncUI();
};

  // [행동 포기] 버튼 추가
  const skipBtn = document.createElement("button");
  skipBtn.textContent = "행동 포기";
  skipBtn.className = "button";
  skipBtn.style.backgroundColor = "#990000";
  skipBtn.style.marginTop = "10px";

  skipBtn.onclick = () => {
    if (confirm(`${char.name}의 이번 턴 행동을 포기하시겠습니까?`)) {
      log(`✦정보✦ ${char.name}, 이번 턴 행동을 포기했습니다.`);
      
      // 즉시 행동 완료 처리
      state.actedAlliesThisTurn.push(char.id);
      state.selectedAction = null;
      
      // 다음 아군 선택 화면으로 이동
      promptAllySelection();
      syncUI();
    }
  };
  
  DOM.skillButtons.appendChild(document.createElement("br"));
  DOM.skillButtons.appendChild(skipBtn);
  
  renderMovementControls(char);
}

function renderMovementControls(char) {
  DOM.moveButtons.innerHTML = "<h4>이동(8방향)</h4>";
  const directions = [
    { d: "↖", x: -1, y: -1 }, { d: "↑", x: 0, y: -1 }, { d: "↗", x: 1, y: -1 },
    { d: "←", x: -1, y: 0 }, { d: "→", x: 1, y: 0 },
    { d: "↙", x: -1, y: 1 }, { d: "↓", x: 0, y: 1 }, { d: "↘", x: 1, y: 1 },
  ];

  directions.forEach((dir, index) => {
    const btn = document.createElement("button");
    btn.textContent = dir.d;
    btn.style.width = "50px"; btn.style.height = "50px"; btn.style.margin = "2px";
    const targetX = char.posX + dir.x;
    const targetY = char.posY + dir.y;
    const isOutOfBounds = targetX < 0 || targetX >= state.mapWidth || targetY < 0 || targetY >= state.mapHeight;
    const isOccupied = state.characterPositions[`${targetX},${targetY}`];

    if (isOutOfBounds || isOccupied) {
      btn.disabled = true; btn.style.opacity = "0.3";
    }

    btn.onclick = () => {
      state.selectedAction = { type: "move", caster: char, moveDelta: { dx: dir.x, dy: dir.y } };
      DOM.targetName.textContent = `이동 예약: (${targetX}, ${targetY})`;
      DOM.confirmBtn.style.display = "block";
      syncUI();
    };
    DOM.moveButtons.appendChild(btn);
    if ((index + 1) % 3 === 0) DOM.moveButtons.appendChild(document.createElement("br"));
  });
}

function selectTarget(targetId) {
  // 1. 스킬 선택 모드인지 먼저 확인
    const isSelectingTarget = state.selectedAction && state.selectedAction.type === "skill";

    // 2. 행동이 이미 완료된 캐릭터인지 확인
    const actedIdx = state.actedAlliesThisTurn.indexOf(targetId);

    // 스킬 타겟을 고르는 중이 아닐 때만 취소 팝업을 띄움
    if (!isSelectingTarget && actedIdx > -1) {
        if (confirm("해당 캐릭터의 행동 예약을 취소하고 다시 설정하시겠습니까?")) {
            state.actedAlliesThisTurn.splice(actedIdx, 1);
            state.playerActionsQueue = state.playerActionsQueue.filter(action => action.caster.id !== targetId);
            const char = state.allyCharacters.find(a => a.id === targetId);
            startCharacterAction(char);
            syncUI();
        }
        return;
    }

    // 3. 스킬 타겟 지정 로직 (스킬 사용 중일 때)
    if (isSelectingTarget) {
        const target = Utils.findCharacterById(targetId, state.allyCharacters, state.enemyCharacters, state.mapObjects);
        if (!target || !target.isAlive) return;

        state.selectedAction.targetId = targetId;
        DOM.targetName.textContent = target.name;
        DOM.confirmBtn.style.display = "block"; // 행동 확정 버튼 노출
        syncUI();
    }
}
function confirmAction() {
  if (!state.selectedAction) return;
  const action = state.selectedAction;
  const { caster, type } = action;

  console.group(`%c[행동 예약] ${caster.name}`, 'color: #4da6ff; font-weight: bold;');
  if (type === "skill") {
    console.log(`스킬명: ${action.skill.name}`);
    const target = Utils.findCharacterById(action.targetId, state.allyCharacters, state.enemyCharacters, state.mapObjects);
    console.log(`대상: ${target ? target.name : "대상 없음"}`);
  } else {
    console.log(`목표: (${caster.posX + action.moveDelta.dx}, ${caster.posY + action.moveDelta.dy})`);
  }
  console.groupEnd();

  state.playerActionsQueue.push(action);
  state.actedAlliesThisTurn.push(caster.id);
  state.selectedAction = null;
  promptAllySelection();
  syncUI();
}

async function executeBattleTurn() {
  DOM.executeBtn.style.display = "none";
  const actionId = state.enemyPreviewAction?.skillId;
  const actionData = MONSTER_SKILLS[actionId];
  const activeBoss = state.enemyCharacters.find(e => e.isAlive && (e.name.includes("테르모르") || e.name.includes("카르나블룸")));

  if (activeBoss && actionData && (actionId.startsWith("GIMMICK_") || actionData.type?.includes("디버프"))) {
    log(`\n<b>[태세 전환] ${activeBoss.name}:</b> ${actionData.name}`);
    actionData.execute(activeBoss, state.allyCharacters, state.enemyCharacters, log, {
      ...state,
      calculateDamage: (a, d, p, t, o = {}) => BattleEngine.calculateDamage(a, d, p, t, { ...o, gimmickData: MONSTER_SKILLS, parseSafeCoords: Utils.parseSafeCoords, battleLog: log }),
      applyHeal: BattleEngine.applyHeal, utils: Utils
    });
    syncUI();
    await new Promise((r) => setTimeout(r, 600));
  }

  log(`\n\n<b>☂︎ 아군의 행동을 개시합니다.<b>\n\n`);

  for (const action of state.playerActionsQueue) {
    const { caster, skill, targetId, moveDelta } = action;
    if (!caster.isAlive) continue;

    if (action.type === "skill") {
      const target = Utils.findCharacterById(targetId, state.allyCharacters, state.enemyCharacters, state.mapObjects);
      log(`✦ ${caster.name}, [${skill.name}] 시전.`);

      // [환원]
      if (caster.hasBuff("restoration")) {
        const restorationBuff = caster.buffs.find((b) => b.id === "restoration");
        if (restorationBuff && restorationBuff.effect && restorationBuff.effect.healPower) {
          const aliveAllies = state.allyCharacters.filter((a) => a.isAlive);
          if (aliveAllies.length > 0) {
            let lowestHpAlly = aliveAllies[0];
            for (let i = 1; i < aliveAllies.length; i++) {
              if (aliveAllies[i].currentHp < lowestHpAlly.currentHp) {
                lowestHpAlly = aliveAllies[i];
              }
            }
            BattleEngine.applyHeal(lowestHpAlly, restorationBuff.effect.healPower, log, "환원"); 
          }
        }
      }
      
      skill.execute(caster, target, state.allyCharacters, state.enemyCharacters, log, {
        ...state,
        applyHeal: BattleEngine.applyHeal,
        calculateDamage: (a, d, p, t, o = {}) => {
          const finalDamage = BattleEngine.calculateDamage(a, d, p, t, { ...o, gimmickData: MONSTER_SKILLS, parseSafeCoords: Utils.parseSafeCoords, battleLog: log });
          console.log(`%c[아군 스킬 계산] %c${a.name} -> %c${d.name} | %c피해: ${finalDamage}`, 'color: #4da6ff; font-weight: bold;', 'color: black;', 'color: #ffcc00;', 'color: #ff0000;');

          if (finalDamage > 0 && d.debuffs && d.debuffs.some(deb => deb.id === "transfer")) {
          
            const healAmount = a.atk;
          BattleEngine.applyHeal(a, healAmount, log, "전이"); 
          }
            

          return finalDamage;
        },
        displayCharacters: syncUI,
        mapObjects: state.mapObjects
      });
      if (!caster.lastSkillTurn) caster.lastSkillTurn = {};
      caster.lastSkillTurn[skill.id] = state.currentTurn;
    } else {
      const oldPos = `${caster.posX},${caster.posY}`;
      delete state.characterPositions[oldPos];
      caster.posX += moveDelta.dx; caster.posY += moveDelta.dy;
      state.characterPositions[`${caster.posX},${caster.posY}`] = caster.id;
      log(`✦ ${caster.name}, (${caster.posX},${caster.posY})로 이동.`);
    }
    syncUI();
    await new Promise((r) => setTimeout(r, 600));
  }

  resolveMinionGimmicks();
  const turnOwner = activeBoss ? activeBoss.name : "적군";
  log(`\n\n☂︎ ${turnOwner}의 반격이 시작됩니다.\n\n`);

  for (const enemy of state.enemyCharacters.filter(e => e.isAlive)) {
    await performEnemyAction(enemy);
    syncUI();
    await new Promise(r => setTimeout(r, 600));
  }

  [...state.allyCharacters, ...state.enemyCharacters].forEach((c) => {
  if (c.isAlive) {
    // 턴 감소 (1턴 종료 직후 실행되어 2->1이 됨)
    c.buffs.forEach((b) => { if (!b.unremovable) b.turnsLeft--; });
    c.debuffs.forEach((d) => { d.turnsLeft--; });
    c.buffs = c.buffs.filter((b) => b.turnsLeft > 0 || b.unremovable);
    c.debuffs = c.debuffs.filter((d) => d.turnsLeft > 0);
  }
});

log(`<b>☂︎ ${state.currentTurn} 턴의 모든 행동이 종료되었습니다.</b>`);
log(`\n<pre>--------------------------------</pre>`);

  checkMapShrink();

  const result = BattleEngine.checkBattleEnd ? BattleEngine.checkBattleEnd(state.allyCharacters, state.enemyCharacters) : null;
  
  if (result === "WIN") {
    state.isBattleStarted = false;
    if (state.selectedMapId === "A-1") {
      log(`\n\n<b>【 스테이지 클리어! 테르모르의 숨결이 잦아듭니다. 】</b>`);
      setTimeout(() => { state.isBattleStarted = true; transitionToNextStage("A-2"); }, 1500);
    } else if (state.selectedMapId === "B-1") {
      log(`\n\n<b>【 제 1막 종료: 인형들이 무대 뒤로 사라집니다. 】</b>`);
      setTimeout(() => { state.isBattleStarted = true; transitionToNextStage("B-2"); }, 1500);
    } else {
      log(`\n\n【 전투 종료: 승리 】`);
      DOM.startBtn.style.display = "block";
    }
  } else if (result === "LOSE") {
    log(`\n\n【 전투 종료: 패배 】`);
    state.isBattleStarted = false; DOM.startBtn.style.display = "block";
  } else {
    prepareNextTurnCycle();
  }
}

// 8. 스테이지 전환 및 기믹 함수
function transitionToNextStage(nextMapId) {
  const config = MAP_CONFIGS[nextMapId];
  if (!config) return;

  state.selectedMapId = nextMapId;
  state.mapWidth = config.width; state.mapHeight = config.height;
  state.enemyCharacters = []; state.mapShrinkState = 0; state.minionsWipedTurn = null;

  config.enemies.forEach((e) => addCharacterAtPos(e.templateId, e.pos));
  state.characterPositions = {};
  state.allyCharacters.forEach(a => { if (a.isAlive) state.characterPositions[`${a.posX},${a.posY}`] = a.id; });
  state.enemyCharacters.forEach(e => { state.characterPositions[`${e.posX},${e.posY}`] = e.id; });

  log(`\n<pre>--------------------------------</pre>`);
  log(`\n<pre>${config.flavorText}</pre>\n`);
  syncUI();
  prepareNextTurnCycle();
}

function resolveMinionGimmicks() {
  if (!state.selectedMapId || !state.selectedMapId.startsWith("B")) return;
  const livingMinions = state.enemyCharacters.filter(e => e.isAlive && (e.name === "클라운" || e.name === "피에로"));
  if (livingMinions.length === 0) {
    if (!state.minionsWipedTurn) state.minionsWipedTurn = state.currentTurn;
    if (state.currentTurn >= state.minionsWipedTurn + 2) {
      log('✦기믹✦ "나의 아이들은 아직 무대를 떠날 준비가 되지 않은 모양이야."');
      addCharacterAtPos("Clown", Utils.getRandomEmptyCell(state.mapWidth, state.mapHeight, state.characterPositions));
      addCharacterAtPos("Pierrot", Utils.getRandomEmptyCell(state.mapWidth, state.mapHeight, state.characterPositions));
      state.minionsWipedTurn = null;
    }
  }
}

function checkMapShrink() {
  if (state.selectedMapId !== "B-2") return;
  const boss = state.enemyCharacters.find(e => e.name === "카르나블룸" && e.isAlive);
  if (!boss) return;
  const hpPercent = (boss.currentHp / boss.maxHp) * 100;
  if (hpPercent <= 20 && state.mapShrinkState < 2) {
    state.mapShrinkState = 2; log("✦기믹✦ [최종 막]: 무대가 극도로 좁아집니다!");
  } else if (hpPercent <= 50 && state.mapShrinkState < 1) {
    state.mapShrinkState = 1; log("✦기믹✦ [제 2막]: 무대가 좁아지기 시작합니다.");
  }
}

async function performEnemyAction(enemy) {
  let actionId;
  
  // 보스급 몬스터는 예고된 스킬 사용, 일반 몬스터는 자신의 스킬 중 랜덤 사용
  const isBoss = enemy.name.includes("테르모르") || enemy.name.includes("카르나블룸");
  
  if (isBoss && state.enemyPreviewAction) {
    actionId = state.enemyPreviewAction.skillId;
  } else if (enemy.skills && enemy.skills.length > 0) {
    // 일반 몬스터는 자신의 템플릿에 정의된 스킬 중 하나를 무작위로 선택
    actionId = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
  }

  const actionData = MONSTER_SKILLS[actionId];
  if (!actionData) return;

  const extendedState = {
    ...state,
    calculateDamage: (a, d, p, t, o = {}) => {
      const dmg = BattleEngine.calculateDamage(a, d, p, t, { ...o, state: state, gimmickData: MONSTER_SKILLS, parseSafeCoords: Utils.parseSafeCoords, battleLog: log });
      
      if (dmg > 0) {
        effectTriggered = true; // 피해가 발생하면 효과가 있었음으로 간주
      } else {
        log(`✦회피✦ ${d.name}, 공격을 완전히 상쇄하거나 회피했습니다.`);
      }
      return dmg;
    },
    applyHeal: BattleEngine.applyHeal
  };
  
  const success = actionData.execute(enemy, state.allyCharacters, state.enemyCharacters, log, extendedState);
  const isDebuffSkill = actionData.type?.includes("디버프") || actionId.includes("SILENCE") || actionId.includes("SPORES");

  if (success && !effectTriggered && !isDebuffSkill) {
    log(`✦정보✦ 아무 일도 일어나지 않았습니다.`);
  }
}

// 9. 초기화 및 전역 등록
document.addEventListener("DOMContentLoaded", () => syncUI());

function syncUI() {
  UI.renderMapGrid(DOM.mapContainer, state.allyCharacters, state.enemyCharacters, state.mapObjects, state.enemyPreviewAction, state.mapWidth, state.mapHeight);
  DOM.allyDisplay.innerHTML = "";
  state.allyCharacters.forEach((char) => {
    const card = UI.createCharacterCard(char, "ally", state.selectedAction?.targetId === char.id, state.isBattleStarted ? null : (id) => deleteChar(id, "ally"), syncUI);
    card.onclick = () => selectTarget(char.id);
    DOM.allyDisplay.appendChild(card);
  });
  DOM.enemyDisplay.innerHTML = "";
  state.enemyCharacters.forEach((char) => {
    const card = UI.createCharacterCard(char, "enemy", state.selectedAction?.targetId === char.id);
    card.onclick = () => selectTarget(char.id);
    DOM.enemyDisplay.appendChild(card);
  });
  updateFirebaseState();
}

let isFirebaseUpdating = false;
async function updateFirebaseState() {
  if (isFirebaseUpdating) return;
  isFirebaseUpdating = true;
  try {
    const battleRef = ref(db, "liveBattle/currentSession");
    await set(battleRef, {
      allyCharacters: state.allyCharacters, enemyCharacters: state.enemyCharacters,
      mapObjects: state.mapObjects, currentTurn: state.currentTurn,
      mapWidth: state.mapWidth, mapHeight: state.mapHeight,
      isBattleStarted: state.isBattleStarted, lastUpdateTime: Date.now(),
    });
  } catch (e) { console.error("데이터 전송 실패:", e); }
  isFirebaseUpdating = false;
}

window.loadSelectedMap = loadSelectedMap;
window.addCharacter = addCharacter;
window.startBattle = startBattle;
window.confirmAction = confirmAction;
window.executeBattleTurn = executeBattleTurn;
window.syncUI = syncUI;
window.transitionToNextStage = transitionToNextStage;
