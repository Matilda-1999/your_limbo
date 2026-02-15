/**
 * monsterSkills.js
 * 모든 몬스터 스킬 및 기믹 통합 관리 (좌표 기반 정규화 버전)
 */

export const MONSTER_SKILLS = {
  // --- [1] 테르모르 스킬 (Stage A) ---
  SKILL_Seismic_Fissure: {
    id: "SKILL_Seismic_Fissure",
    name: "균열의 진동",
    hitArea: [{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:1,y:2},{x:3,y:2},{x:1,y:3},{x:2,y:3},{x:3,y:3}],
    execute: (caster, allies, enemies, battleLog, state) => {
      const area = MONSTER_SKILLS.SKILL_Seismic_Fissure.hitArea;
      const hitTargets = allies.filter(t => t.isAlive && area.some(pos => pos.x === t.posX && pos.y === t.posY));
      
      hitTargets.forEach(target => {
        const damage = state.calculateDamage(caster, target, 1.0, "physical");
        target.takeDamage(damage, battleLog, caster);
        battleLog(`✦피해✦ ${caster.name}의 진동이 ${target.name}에게 적중.`);
      });
      return true;
    },
  },

  SKILL_Echo_of_Silence: {
    id: "SKILL_Echo_of_Silence",
    name: "침묵의 메아리",
    hitArea: [{x:0,y:2},{x:1,y:1},{x:3,y:1},{x:2,y:0},{x:4,y:2},{x:1,y:3},{x:3,y:3}],
    script: `\n<pre>"자연의 숨결 앞에서는 그 어떤 주문도 무의미하다."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const area = MONSTER_SKILLS.SKILL_Echo_of_Silence.hitArea;
      const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));

      if (hitTargets.length > 0) {
        hitTargets.forEach(t => {
          t.addDebuff("silence", "[침묵]", hitTargets.length, { description: `주문 사용 불가` });
          battleLog(`✦광역 디버프✦ ${caster.name}의 메아리가 ${t.name}에게 적중.`);
        });
      }
      return true;
    },
  },

  SKILL_Crushing_Sky: {
    id: "SKILL_Crushing_Sky",
    name: "무너지는 하늘",
    hitArea: [{x:2,y:0},{x:2,y:1},{x:0,y:2},{x:1,y:2},{x:3,y:2},{x:4,y:2},{x:2,y:3},{x:2,y:4}],
    execute: (caster, allies, enemies, battleLog, state) => {
      const area = MONSTER_SKILLS.SKILL_Crushing_Sky.hitArea;
      const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));

      hitTargets.forEach(target => {
        const damage = state.calculateDamage(caster, target, 1.2, "physical");
        target.takeDamage(damage, battleLog, caster);
        battleLog(`✦피해✦ 하늘에서 떨어진 석괴가 ${target.name}에게 적중.`);
      });
      return true;
    },
  },

  SKILL_Birth_of_Vines: {
    id: "SKILL_Birth_of_Vines",
    name: "덩굴 탄생",
    hitArea: [{x:0,y:0}, {x:0,y:2}, {x:0,y:4}, {x:1,y:1}, {x:1,y:3}, {x:2,y:0}, {x:2,y:2}, {x:2,y:4}, {x:3,y:1}, {x:3,y:3}, {x:4,y:0}, {x:4,y:2}, {x:4,y:4}],
    execute: (caster, allies, enemies, battleLog, state) => {
      const area = MONSTER_SKILLS.SKILL_Birth_of_Vines.hitArea;
      const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));
      hitTargets.forEach(target => {
        const damage = state.calculateDamage(caster, target, 1.2, "magical");
        target.takeDamage(damage, battleLog, caster);
      });
      return true;
    },
  },

  SKILL_Seeds_Wrath: {
    id: "SKILL_Seeds_Wrath",
    name: "씨앗의 분노",
    hitArea: [{x:1,y:1}, {x:1,y:2}, {x:1,y:3}, {x:2,y:1}, {x:2,y:3}, {x:3,y:1}, {x:3,y:2}, {x:3,y:3}, {x:0,y:0}, {x:0,y:4}, {x:4,y:0}, {x:4,y:4}],
    execute: (caster, allies, enemies, battleLog, state) => {
      const greenArea = [{x:1,y:1},{x:1,y:2},{x:1,y:3},{x:2,y:1},{x:2,y:3},{x:3,y:1},{x:3,y:2},{x:3,y:3}];
      const blueArea = [{x:0,y:0},{x:0,y:4},{x:4,y:0},{x:4,y:4}];
      allies.filter(t => t.isAlive).forEach(target => {
        if (greenArea.some(p => p.x === target.posX && p.y === target.posY)) {
          const d = state.calculateDamage(caster, target, 1.5, "magical");
          target.takeDamage(d, battleLog, caster);
        }
        if (blueArea.some(p => p.x === target.posX && p.y === target.posY)) {
          target.addDebuff("disarm", "[무장 해제]", 1, {});
          battleLog(`✦상태 이상✦ ${target.name}에게 씨앗이 붙어 무장이 해제됩니다.`);
        }
      });
      return true;
    },
  },

  // --- [2] 피에로 & 클라운 스킬 ---
  SKILL_Slapstick_Comdey_P: {
    id: "SKILL_Slapstick_Comdey_P",
    name: "슬랩스틱 코미디(피에로)",
    execute: (caster, allies, enemies, battleLog, state) => {
      const offsets = [{ dx: 0, dy: -2 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 2 }];
      allies.filter(t => t.isAlive).forEach(target => {
        if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
          const d = state.calculateDamage(caster, target, 1.0, "physical");
          target.takeDamage(d, battleLog, caster);
          if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) state.applyRandomBrand(target);
        }
      });
      return true;
    }
  },

  // --- [3] 카르나블룸 스킬 (Stage B) ---
  SKILL_Play1: {
    id: "SKILL_Play1",
    name: "유희(1,3,5타)",
    hitArea: [{x:0,y:4},{x:1,y:4},{x:2,y:4},{x:3,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4},{x:8,y:4},{x:4,y:0},{x:4,y:1},{x:4,y:2},{x:4,y:3},{x:4,y:5},{x:4,y:6},{x:4,y:7},{x:4,y:8}],
    execute: (caster, allies, enemies, battleLog, state) => {
      const area = MONSTER_SKILLS.SKILL_Play1.hitArea;
      allies.filter(t => t.isAlive).forEach(target => {
        if (area.some(p => p.x === target.posX && p.y === target.posY)) {
          const d = state.calculateDamage(caster, target, 1.1, "magical");
          target.takeDamage(d, battleLog, caster);
        }
      });
      return true;
    }
  },

 // --- [4] 맵 기믹 데이터 ---

  GIMMICK_Aegis_of_Earth1: {
    id: "GIMMICK_Aegis_of_Earth1",
    name: "대지의 수호(동)",
    // UI 예고 및 BattleEngine 판정용 좌표
    hitArea: [{x:3,y:1},{x:3,y:2},{x:3,y:3},{x:4,y:0},{x:4,y:1},{x:4,y:2},{x:4,y:3},{x:4,y:4}],
    script: `<pre>"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth1"; 
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(동)] 태세를 갖춥니다. 동쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Aegis_of_Earth2: {
    id: "GIMMICK_Aegis_of_Earth2",
    name: "대지의 수호(서)",
    hitArea: [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:1,y:1},{x:1,y:2},{x:1,y:3}],
    script: `<pre>"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth2";
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(서)] 태세를 갖춥니다. 서쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Aegis_of_Earth3: {
    id: "GIMMICK_Aegis_of_Earth3",
    name: "대지의 수호(남)",
    hitArea: [{x:1,y:3},{x:2,y:3},{x:3,y:3},{x:0,y:4},{x:1,y:4},{x:2,y:4},{x:3,y:4},{x:4,y:4}],
    script: `<pre>"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth3";
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(남)] 태세를 갖춥니다. 남쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Aegis_of_Earth4: {
    id: "GIMMICK_Aegis_of_Earth4",
    name: "대지의 수호(북)",
    hitArea: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:4,y:0},{x:1,y:1},{x:2,y:1},{x:3,y:1}],
    script: `<pre>"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth4";
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(북)] 태세를 갖춥니다. 북쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Seed_of_Devour: {
    id: "GIMMICK_Seed_of_Devour",
    name: "흡수의 술식",
    execute: (caster, allies, enemies, battleLog, state) => {
      const { mapObjects, characterPositions, mapWidth, mapHeight, utils } = state;
      const gimmickType = Math.floor(Math.random() * 3) + 1; 

      if (gimmickType === 1) {
        for (let i = 0; i < 2; i++) {
          const pos = utils.getRandomEmptyCell(mapWidth, mapHeight, characterPositions);
          if (pos) {
            const fruit = { id: `FRUIT_${Date.now()}_${i}`, name: "생명의 열매", type: "fruit", posX: pos.x, posY: pos.y, isAlive: true, hp: 50 };
            mapObjects.push(fruit);
            characterPositions[`${pos.x},${pos.y}`] = fruit.id;
          }
        }
        battleLog(`✦기믹 발동✦ 맵에 [생명의 열매]가 생성되었습니다!`);
      } else if (gimmickType === 3) {
        const spring = { id: `SPRING_${Date.now()}`, name: "메마른 생명의 샘", type: "spring", posX: 2, posY: 0, isAlive: true, healingReceived: 0, maxHealingRequired: 50 };
        mapObjects.push(spring);
        characterPositions[`2,0`] = spring.id;
        battleLog(`✦기믹 발동✦ [생명의 샘]이 나타났습니다!`);
      }
      return true;
    },
  }
};
