/**
 * renderUI.js
 * index.html의 스타일과 아이콘을 유지하며 게임의 시각적 요소를 렌더링합니다.
 */

import { SPAWN_POINTS } from '../data/mapConfigs.js';

export const UI = {
    /**
     * 맵 그리드 렌더링: 안전지대(파랑)와 공격예고(주황)를 구분하여 그립니다.
     */
    renderMapGrid(container, allies, enemies, objects = [], previewAction = null, width = 5, height = 5) {
        if (!container) return;
        container.innerHTML = "";

        // 1. hitArea를 안전하게 확보합니다. (null이나 undefined일 경우 빈 배열 할당)
    const hitArea = previewAction?.hitArea || []; 
    
    // 2. 위에서 만든 안전한 'hitArea' 변수를 사용하여 map을 돌립니다.
    const previewCoordSet = new Set(hitArea.map(p => `${p.x},${p.y}`));
    
    const previewSkillId = previewAction?.skillId || null;
    const clownSpawns = new Set(SPAWN_POINTS.Clown.map(p => `${p.x},${p.y}`));
    const pierrotSpawns = new Set(SPAWN_POINTS.Pierrot.map(p => `${p.x},${p.y}`));
        
        const contentMap = {};
        [...allies, ...enemies].forEach(char => {
            if (char.isAlive && char.posX !== -1) {
                const key = `${char.posX},${char.posY}`;
                if (!contentMap[key]) contentMap[key] = [];
                contentMap[key].push({
                    type: "character",
                    initial: char.name.length > 1 ? char.name.substring(0, 2) : char.name,
                    team: allies.includes(char) ? "ally" : "enemy"
                });
            }
        });

        objects.forEach(obj => {
            if (!obj.isAlive) return;
            const key = `${obj.posX},${obj.posY}`;
            if (!contentMap[key]) contentMap[key] = [];
            contentMap[key].push({ type: "gimmick", gimmickType: obj.type, obj });
        });

        for (let y = 0; y < height; y++) {
            const rowDiv = document.createElement("div");
            rowDiv.className = "map-row";
            for (let x = 0; x < width; x++) {
                const cellDiv = document.createElement("div");
                cellDiv.className = "map-cell";
                const key = `${x},${y}`;

                if (clownSpawns.has(key)) cellDiv.classList.add("clown-spawn");
                if (pierrotSpawns.has(key)) cellDiv.classList.add("pierrot-spawn");

                // 스킬 범위 예고 (기믹/안전지대는 파란색, 일반 공격은 주황색)
                if (previewCoordSet.has(key)) {
                    const isSafeZone = previewSkillId?.includes("Aegis_of_Earth") || previewSkillId === "GIMMICK_Script_Reversal";
                    cellDiv.classList.add(isSafeZone ? "safe-zone" : "skill-preview-zone");
                }

                if (contentMap[key]) {
                    contentMap[key].forEach(item => {
                        const marker = document.createElement("div");
                        if (item.type === "character") {
                            marker.className = `char-marker ${item.team}`;
                            marker.textContent = item.initial;
                        } else if (item.type === "gimmick") {
                            marker.className = `gimmick-object gimmick-${item.gimmickType}`;
                            if (item.gimmickType === "fruit") marker.textContent = "🌱";
                            else if (item.gimmickType === "fissure") marker.textContent = "💥";
                            else if (item.gimmickType === "spring") marker.textContent = "⛲️";
                        }
                        cellDiv.appendChild(marker);
                    });
                }
                rowDiv.appendChild(cellDiv);
            }
            container.appendChild(rowDiv);
        }
    },

    /**
     * 캐릭터 카드 생성: index.html의 .character-stats 스타일을 따릅니다.
     */
    createCharacterCard(character, team, isSelected = false, onDelete = null) {
        const card = document.createElement("div");
        card.className = `character-stats ${isSelected ? 'selected' : ''}`;
        
        // 아군/적군에 따른 아이콘 및 정보 설정
        const teamIcon = team === "ally" ? "groups" : "sentiment_very_dissatisfied";
        const jobDisplay = team === "ally" ? ` (${character.job})` : "";
        const shieldHtml = (team === "ally" && character.shield > 0) ? ` (+${Math.round(character.shield)}🛡️)` : "";
    
        // 1. 공통 상단 정보 (이름, 타입, 좌표)
        let cardHtml = `
            <p>
                <span class="material-icons-outlined" style="font-size: 1.1em; color: var(--color-primary-gold);">
                    ${teamIcon}
                </span>
                <strong>${character.name} (${character.type})${jobDisplay}</strong> 
                ${character.posX !== -1 ? `[${character.posX},${character.posY}]` : ""}
            </p>
        `;
    
        // 2. 팀별 상세 정보 분기
        if (team === "ally") {
            // 아군은 기존과 동일하게 모든 정보 노출
            cardHtml += `
                <p>HP: ${Math.round(character.currentHp)} / ${character.maxHp}${shieldHtml}</p>
                <p>공격력: ${character.getEffectiveStat("atk")} | 마법 공격력: ${character.getEffectiveStat("matk")}</p>
                <p>방어력: ${character.getEffectiveStat("def")} | 마법 방어력: ${character.getEffectiveStat("mdef")}</p>
            `;
        } else {
            // 적군은 상세 수치 숨김 (뷰어 모드와 동일)
            cardHtml += `<p style="color: #888;">[상세 정보 확인 불가]</p>`;
        }
    
        // 3. 공통 하단 정보 (상태, 버프/디버프)
        cardHtml += `
            <p>상태: ${character.isAlive ? "생존" : '<span style="color:var(--color-accent-red);">쓰러짐</span>'}</p>
            
            ${(() => {
                const uniqueBuffLabels = [];
                character.buffs.forEach(b => {
                    if (!b.name || b.name.trim() === "") return;
                    const stacks = (b.effect && b.effect.stacks) ? b.effect.stacks : 1;
                    const label = `${b.name}(${stacks}스택(${b.turnsLeft}턴))`;
                    if (!uniqueBuffLabels.includes(label)) uniqueBuffLabels.push(label);
                });
                return uniqueBuffLabels.length > 0 ? `<p>버프: ${uniqueBuffLabels.join(", ")}</p>` : "";
            })()}
    
            ${(() => {
                const uniqueDebuffLabels = [];
                character.debuffs.forEach(d => {
                    if (!d.name || d.name.trim() === "") return;
                    const stacks = d.stacks || 1;
                    const label = `${d.name}(${stacks}스택(${d.turnsLeft}턴))`;
                    if (!uniqueDebuffLabels.includes(label)) uniqueDebuffLabels.push(label);
                });
                return uniqueDebuffLabels.length > 0 ? `<p>디버프: ${uniqueDebuffLabels.join(", ")}</p>` : "";
            })()}
        `;
    
        card.innerHTML = cardHtml;
    
        // 삭제 버튼 (배치 단계에서만 노출)
        if (onDelete) {
            const delBtn = document.createElement("button");
            delBtn.className = "delete-char-button";
            delBtn.textContent = "X";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                onDelete(character.id);
            };
            card.appendChild(delBtn);
        }
    
        return card;
    },
    /**
     * 전투 로그 출력: index.html의 .battle-log 영역에 메시지 추가
     */
    logToBattleLog(container, message) {
        if (!container) return;
        const cleanMsg = typeof message === "string" ? message.trim() : message;
        container.innerHTML += cleanMsg + "<br>";
        container.scrollTop = container.scrollHeight;
    },

    /**
     * 스킬 설명 렌더링
     */
    renderSkillDescription(container, skill) {
        if (!container) return;
        if (!skill) {
            container.innerHTML = "";
            return;
        }
        container.innerHTML = `<strong>${skill.name}</strong>: ${skill.description || "설명 없음"}`;
    }
};
