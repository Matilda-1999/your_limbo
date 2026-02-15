/**
 * monsterSkills.js
 * 몬스터 및 보스 전용 스킬, 기믹 로직을 관리합니다.
 */

/**
 * monsterSkills.js
 * 모든 몬스터 스킬 및 기믹 통합 관리 (script 데이터 완전 보존 버전)
 */

export const MONSTER_SKILLS = {
  // --- [1] 테르모르 스킬 ---
  SKILL_Seismic_Fissure: {
    id: "SKILL_Seismic_Fissure",
    name: "균열의 진동",
    type: "광역 공격",
    script: `\n<pre>마른 땅이 갈라지며 균열이 퍼져나간다.\n이 전장은 오로지 한 생명의 손아귀에 놓여 있다.\n"땅이 갈라지는 소리를 들은 적 있느냐."</pre>\n`,
    description: "피격 범위 내 모든 적에게 공격력만큼 피해를 줍니다.",
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "1,1;2,1;3,1;1,2;3,2;1,3;2,3;3,3".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const damage = caster.getEffectiveStat("atk");
      enemies.forEach(target => {
        if (hitArea.some(pos => pos.x === target.posX && pos.y === target.posY)) {
          battleLog(`✦광역 피해✦ ${caster.name}의 [균열의 진동]이 ${target.name}에게 적중.`);
          target.takeDamage(damage, battleLog, caster);
        }
      });
      return true;
    },
  },

  SKILL_Echo_of_Silence: {
    id: "SKILL_Echo_of_Silence",
    name: "침묵의 메아리",
    type: "광역 디버프",
    script: `\n<pre>기묘한 울림이 공간을 가른다.\n거대한 풍광의 압을 앞에 두고, 달리 무엇을 말할 수 있겠는가?\n"자연의 숨결 앞에서는 그 어떤 주문도 무의미하다."</pre>\n`,
    description: "피격 범위 내 모든 적에게 [침묵]을 부여합니다.",
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "0,2;1,1;3,1;2,0;4,2;1,3;3,3".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const targets = enemies.filter(t => hitArea.some(p => p.x === t.posX && p.y === t.posY));
      const duration = targets.length;
      if (duration > 0) {
        targets.forEach(t => t.addDebuff("silence", "[침묵]", duration, { description: `주문 사용 불가 (${duration}턴)` }));
        battleLog(`✦광역 디버프✦ ${caster.name}의 [침묵의 메아리]가 적중.`);
      }
      return true;
    },
  },

  SKILL_Crushing_Sky: {
    id: "SKILL_Crushing_Sky",
    name: "무너지는 하늘",
    type: "광역 공격",
    script: `\n<pre>거대한 석괴가 하늘에서 떨어지기 시작한다.\n때로 자연이라는 것은, 인간에게 이다지도 무자비하다.\n"대지가 너희에게 분노하리라."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "2,0;2,1;0,2;1,2;3,2;4,2;2,3;2,4".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const damage = caster.getEffectiveStat("atk");
      enemies.forEach(target => {
        if (hitArea.some(pos => pos.x === target.posX && pos.y === target.posY)) {
          target.takeDamage(damage, battleLog, caster);
        }
      });
      return true;
    },
  },

  SKILL_Birth_of_Vines: {
    id: "SKILL_Birth_of_Vines",
    name: "덩굴 탄생",
    type: "광역 공격",
    script: `\n<pre>바닥으로부터 수많은 덩굴이 솟구친다.\n벗어날 수 없는 공포가 당신의 발목을 옥죄어 온다.\n"이 땅에 모습을 드러낸 이들을, 잊지 않겠다."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "0,0;0,2;0,4;1,1;1,3;2,0;2,2;2,4;3,1;3,3;4,0;4,2;4,4".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const damage = caster.getEffectiveStat("matk");
      enemies.forEach(target => {
        if (target.isAlive && hitArea.some(pos => pos.x === target.posX && pos.y === target.posY)) {
          target.takeDamage(damage, battleLog, caster);
        }
      });
      return true;
    },
  },

  SKILL_Spores_of_Silence: {
    id: "SKILL_Spores_of_Silence",
    name: "침묵의 포자",
    type: "광역 디버프",
    script: `\n<pre>고운 꽃가루가 하늘을 뒤덮는다.\n생경한 아름다움은 고요한 찬사만을 강요한다.\n"많은 말은 필요하지 않은 법."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "0,0;1,0;2,0;3,0;4,0;0,2;1,2;3,2;4,2;0,4;1,4;2,4;3,4;4,4".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const targets = enemies.filter(t => t.isAlive && hitArea.some(p => p.x === t.posX && p.y === t.posY));
      if (targets.length > 0) {
        targets.forEach(t => t.addDebuff("disarm", "[무장 해제]", targets.length, {}));
      }
      return true;
    },
  },

  SKILL_Seeds_Wrath: {
    id: "SKILL_Seeds_Wrath",
    name: "씨앗의 분노",
    type: "광역 복합",
    script: `\n<pre>땅속 깊은 곳에서 들려오는 불길한 진동.\n잠들어 있던 씨앗이 한순간 깨어난다.\n"분노하라. 그리하여 너희를 삼킬 것이다."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const greenArea = "1,1;1,2;1,3;2,1;2,3;3,1;3,2;3,3".split(";").map(s => s.split(",").map(Number));
      const blueArea = "0,0;0,4;4,0;4,4".split(";").map(s => s.split(",").map(Number));
      const damage = caster.getEffectiveStat("matk");
      enemies.filter(t => t.isAlive).forEach(target => {
        if (greenArea.some(p => p[0] === target.posX && p[1] === target.posY)) target.takeDamage(damage, battleLog, caster);
        if (blueArea.some(p => p[0] === target.posX && p[1] === target.posY)) target.addDebuff("disarm", "[무장 해제]", 1, {});
      });
      return true;
    },
  },

  // --- [2] 피에로 & 클라운 스킬 ---
  SKILL_Slapstick_Comdey_P: {
    id: "SKILL_Slapstick_Comdey_P",
    name: "슬랩스틱 코미디(피에로)",
    script: `\n<pre>와장창! 어때, 어때? 놀랐지?!</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const offsets = [{ dx: 0, dy: -2 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 2 }];
      const damage = caster.getEffectiveStat("atk");
      enemies.forEach(target => {
        if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
          target.takeDamage(damage, battleLog, caster);
          if (caster.hasBuff("duet_enrage")) state.applyRandomBrand(target);
        }
      });
      return true;
    }
  },

  SKILL_Slapstick_Comdey_C: {
    id: "SKILL_Slapstick_Comdey_C",
    name: "슬랩스틱 코미디(클라운)",
    script: `\n<pre>하핫! 다, 다들 즐겁지? 응……?</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const offsets = [{ dx: -2, dy: 0 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }];
      const damage = caster.getEffectiveStat("matk");
      enemies.forEach(target => {
        if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
          target.takeDamage(damage, battleLog, caster);
          if (caster.hasBuff("duet_enrage")) state.applyRandomBrand(target);
        }
      });
      return true;
    }
  },

  SKILL_Get_a_Present_P: {
    id: "SKILL_Get_a_Present_P",
    name: "선물 받아!(피에로)",
    script: `\n<pre>깜~짝 선물 등장이요!</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const offsets = [{ dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }];
      const damage = caster.getEffectiveStat("atk");
      enemies.forEach(target => {
        if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
          target.takeDamage(damage, battleLog, caster);
          if (caster.hasBuff("duet_enrage")) state.applyRandomBrand(target);
        }
      });
      return true;
    }
  },

  SKILL_Get_a_Present_C: {
    id: "SKILL_Get_a_Present_C",
    name: "선물 받아!(클라운)",
    script: `\n<pre>깜짝 선물, 줘야 한댔어…….</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const offsets = [{ dx: -2, dy: -2 }, { dx: -2, dy: 2 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: 2, dy: -2 }, { dx: 2, dy: 2 }];
      const damage = caster.getEffectiveStat("matk");
      enemies.forEach(target => {
        if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
          target.takeDamage(damage, battleLog, caster);
          if (caster.hasBuff("duet_enrage")) state.applyRandomBrand(target);
        }
      });
      return true;
    }
  },

  // --- [3] 카르나블룸 스킬 ---
  SKILL_Thread_of_Emotion: {
    id: "SKILL_Thread_of_Emotion",
    name: "감정의 실",
    script: `\n<pre>색색의 리본이 솟구쳐 가느다란 손가락을 감싼다.\n그것은 누군가의 의지를, 자아를, 이성을, 손쉽게 조롱한다.\n"기쁨도, 공포도. 모두 내려놓고 나에게 몸을 맡기는 게 어떻겠니."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "0,0;1,0;1,1;2,0;2,1;2,2;3,0;3,1;3,2;3,3;4,0;4,1;4,2;4,3;5,0;5,1;5,2;5,3;6,0;6,1;6,2;7,0;7,1;8,0;0,8;1,7;1,8;2,6;2,7;2,8;3,5;3,6;3,7;3,8;4,5;4,6;4,7;4,8;5,5;5,6;5,7;5,8;6,6;6,7;6,8;7,7;7,8;8,8".split(";").map(s => s.split(",").map(Number));
      enemies.forEach(target => {
        if (target.isAlive && hitArea.some(p => p[0] === target.posX && p[1] === target.posY)) {
          target.addDebuff("melancholy_brand", "[우울 낙인]", 99, {});
          target.addDebuff("ecstasy_brand", "[환희 낙인]", 99, {});
          target.addDebuff("nightmare", "[악몽]", 99, {});
        }
      });
      return true;
    }
  },

  SKILL_Play1: {
    id: "SKILL_Play1",
    name: "유희(1,3,5타)",
    script: `\n<pre>불꽃의 고리가 무대 위를 전부 태울 듯 회전한다.\n박자를 놓치는 순간, 불길이 당신을 스쳐 간다.\n"집중이 깨지는 순간을 조심해야 해. 다칠지도 모르니."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "0,4;1,4;2,4;3,4;5,4;6,4;7,4;8,4;4,0;4,1;4,2;4,3;4,5;4,6;4,7;4,8".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const damage = caster.getEffectiveStat("matk");
      enemies.forEach(target => {
        if (target.isAlive && hitArea.some(p => p.x === target.posX && p.y === target.posY)) target.takeDamage(damage, battleLog, caster);
      });
      return true;
    }
  },

  SKILL_Play2: {
    id: "SKILL_Play2",
    name: "유희(2,4타)",
    script: `\n<pre>불꽃의 고리가 무대 위를 전부 태울 듯 회전한다.\n박자를 놓치는 순간, 불길이 당신을 스쳐 간다.\n"집중이 깨지는 순간을 조심해야 해. 다칠지도 모르니."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const hitArea = "0,0;1,1;2,2;3,3;5,5;6,6;7,7;8,8;0,8;1,7;2,6;3,5;5,3;6,2;7,1;8,0".split(";").map(s => ({ x: Number(s.split(",")[0]), y: Number(s.split(",")[1]) }));
      const damage = caster.getEffectiveStat("matk");
      enemies.forEach(target => {
        if (target.isAlive && hitArea.some(p => p.x === target.posX && p.y === target.posY)) target.takeDamage(damage, battleLog, caster);
      });
      return true;
    }
  },

  SKILL_Crimson: {
    id: "SKILL_Crimson",
    name: "진홍",
    script: `\n<pre>장난감들이 공중에서 빙글빙글 돌며 떨어진다.\n그것들이 바닥에 닿을 때, 무대는 숨을 멈춘다.\n"그 표정, 무대 위에서 더 보고 싶어. 이리 올라오렴."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const debuffArea = "0,0;0,1;0,2;0,3;0,4;0,5;0,6;0,7;0,8;1,0;1,8;2,0;2,8;3,0;3,8;4,0;4,8;5,0;5,8;6,0;6,8;7,0;7,8;8,0;8,1;8,2;8,3;8,4;8,5;8,6;8,7;8,8;3,3;3,5;5,3;5,5".split(";").map(s => s.split(",").map(Number));
      const damageArea = "1,1;1,7;2,2;2,3;2,5;2,6;3,2;3,4;3,6;4,3;4,5;5,2;5,4;5,6;6,2;6,3;6,5;6,6;7,1;7,7".split(";").map(s => s.split(",").map(Number));
      const damage = caster.getEffectiveStat("matk");
      enemies.filter(t => t.isAlive).forEach(target => {
        if (debuffArea.some(p => p[0] === target.posX && p[1] === target.posY)) {
          target.addDebuff("melancholy_brand", "[우울 낙인]", 99, { unremovable: false });
          target.addDebuff("ecstasy_brand", "[환희 낙인]", 99, { unremovable: false });
          target.addDebuff("nightmare", "[악몽]", 99, { unremovable: false });
        }
        if (damageArea.some(p => p[0] === target.posX && p[1] === target.posY)) target.takeDamage(damage, battleLog, caster);
      });
      return true;
    }
  },

  SKILL_Silence: {
    id: "SKILL_Silence",
    name: "침묵",
    script: `\n<pre>불협화음은 예고 없이 중단된다.\n인형의 동작은 크게 흔들리고, 무대 위에서 비틀거린다.\n"이건 예정된 장면이 아니야……."</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.addDebuff("groggy", "[침묵](그로기)", 2, {});
      return true;
    }
  },

  // --- [4] 맵 기믹 데이터 ---
  GIMMICK_Aegis_of_Earth1: {
    id: "GIMMICK_Aegis_of_Earth1",
    name: "대지의 수호(동)",
    coords: "3,1;3,2;3,3;4,0;4,1;4,2;4,3;4,4",
    script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 동쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth1"; // 기믹 활성화
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(동)] 태세를 갖춥니다. 동쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Aegis_of_Earth2: {
    id: "GIMMICK_Aegis_of_Earth2",
    name: "대지의 수호(서)",
    coords: "0,0;0,1;0,2;0,3;0,4;1,1;1,2;1,3",
    script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 서쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth2"; // 기믹 활성화
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(서)] 태세를 갖춥니다. 서쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Aegis_of_Earth3: {
    id: "GIMMICK_Aegis_of_Earth3",
    name: "대지의 수호(남)",
    coords: "1,3;2,3;3,3;0,4;1,4;2,4;3,4;4,4",
    script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 남쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth3"; // 기믹 활성화
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(남)] 태세를 갖춥니다. 남쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  GIMMICK_Aegis_of_Earth4: {
    id: "GIMMICK_Aegis_of_Earth4",
    name: "대지의 수호(북)",
    coords: "0,0;1,0;2,0;3,0;4,0;1,1;2,1;3,1",
    script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 북쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      caster.activeGimmick = "GIMMICK_Aegis_of_Earth4"; // 기믹 활성화
      battleLog(`✦기믹 발동✦ ${caster.name}이 [대지의 수호(북)] 태세를 갖춥니다. 북쪽 구역(파란색)이 안전지대가 됩니다.`);
      return true;
    },
  },

  // --- [테르모르 기믹 추가] ---
  GIMMICK_Seed_of_Devour: {
    id: "GIMMICK_Seed_of_Devour",
    name: "흡수의 술식",
    execute: (caster, allies, enemies, battleLog, state) => {
      const { mapObjects, characterPositions, mapWidth, mapHeight } = state;
      
      // 1~3 사이의 숫자를 무작위로 선택
      const gimmickType = Math.floor(Math.random() * 3) + 1; 

      if (gimmickType === 1) {
        // [하위 기믹 1: 열매 파괴] - 맵에 2개의 열매 생성
        for (let i = 0; i < 2; i++) {
          const pos = Utils.getRandomEmptyCell(mapWidth, mapHeight, characterPositions);
          if (pos) {
            const fruit = { id: `FRUIT_${Date.now()}_${i}`, name: "생명의 열매", type: "fruit", posX: pos.x, posY: pos.y, isAlive: true, hp: 50 };
            mapObjects.push(fruit);
            characterPositions[`${pos.x},${pos.y}`] = fruit.id;
          }
        }
        battleLog(`✦기믹 발동✦ "씨앗은 생명을 흡수해, 다시 죽음을 틔운다." 맵에 열매가 생성되었습니다!`);

      } else if (gimmickType === 2) {
        // [하위 기믹 2: 불안정한 균열] - 3개의 균열 지대 생성
        for (let i = 0; i < 3; i++) {
          const pos = Utils.getRandomEmptyCell(mapWidth, mapHeight, characterPositions);
          if (pos) {
            const fissure = { id: `FISSURE_${Date.now()}_${i}`, name: "불안정한 균열", type: "fissure", posX: pos.x, posY: pos.y, isAlive: true, timer: 3 };
            mapObjects.push(fissure);
            characterPositions[`${pos.x},${pos.y}`] = fissure.id;
          }
        }
        battleLog(`✦기믹 발동✦ "뿌리는 뽑아도 뽑히지 않고, 다시 죽음을 틔운다." 균열 지대가 생성되었습니다!`);

      } else {
        // [하위 기믹 3: 메마른 생명의 샘] - 힐러 상호작용 오브젝트 생성
        const pos = { x: 2, y: 0 }; // 특정 위치 고정 혹은 랜덤
        const spring = { 
          id: `SPRING_${Date.now()}`, 
          name: "메마른 생명의 샘", 
          type: "spring", 
          posX: pos.x, 
          posY: pos.y, 
          isAlive: true, 
          healingReceived: 0, 
          maxHealingRequired: 50 
        };
        mapObjects.push(spring);
        characterPositions[`${pos.x},${pos.y}`] = spring.id;
        battleLog(`✦기믹 발동✦ "마른 땅에서도 씨앗은 움트니, 비로소 생명이 된다." 생명의 샘이 나타났습니다!`);
      }
      return true;
    },
  },
  
  // 균열의 길
  GIMMICK_Path_of_Ruin: {
    id: "GIMMICK_Path_of_Ruin",
    name: "균열의 길",
    script: `<pre>\n균열이 퍼지며, 땅 아래서 검은 뿌리가 꿈틀댄다.\n번져오는 재해 앞에서 길을 찾아야 한다.\n"생명의 뿌리를 꺾을 수 있다고 믿는가?"\n</pre>`,
    execute: (caster, allies, enemies, battleLog, state) => {
      const { dynamicData } = state;
      caster.addBuff("path_of_ruin_telegraph", "균열의 길 예고", 2, dynamicData);
      battleLog(`✦기믹 발동✦ ${caster.name}이 [균열의 길]을 생성합니다. 1턴 뒤 예고된 타일에 피해를 줍니다.`);
      return true;
    },
  },

  GIMMICK_Laugh_of: {
    id: "GIMMICK_Laugh_of",
    name: "광대의 웃음",
    script: `\n<pre>퍼레이드 음악이 늘어지며, 일그러진다.\n불협화음 속으로 섬찟한 웃음소리가 들린다.\n"광대는 언제나 감정에 따라 춤을 추지. 함께 웃어 줄래?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      state.newGimmickState = { type: "clown_emotion_laugh", turnStart: state.currentTurn, duration: 3, clownHits: 0, pierrotHits: 0 };
      return true;
    }
  },
  GIMMICK_Tears_of: {
    id: "GIMMICK_Tears_of",
    name: "광대의 눈물",
    script: `\n<pre>퍼레이드 음악이 늘어지며, 일그러진다.\n불협화음 속으로 섬찟한 울음소리가 들린다.\n"광대는 언제나 감정에 따라 춤을 추지. 함께 울어 줄래?"</pre>\n`,
    execute: (caster, allies, enemies, battleLog, state) => {
      state.newGimmickState = { type: "clown_emotion_tear", turnStart: state.currentTurn, duration: 3, clownHits: 0, pierrotHits: 0 };
      return true;
    }
  }
};
