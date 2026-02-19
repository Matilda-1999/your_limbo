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
   script: `\n<pre>"마른 땅이 갈라지며 균열이 퍼져나간다 \n이 전장은 오로지 한 생명의 손아귀에 놓여 있다. \n"땅이 갈라지는 소리를 들은 적 있느냐.""</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const area = MONSTER_SKILLS.SKILL_Seismic_Fissure.hitArea;
     const hitTargets = allies.filter(t => t.isAlive && area.some(pos => pos.x === t.posX && pos.y === t.posY));
     
     hitTargets.forEach(target => {
       const damage = state.calculateDamage(caster, target, 1.0, "physical");
       target.takeDamage(damage, battleLog, caster, allies, enemies, state);
       battleLog(`✦피해✦ ${caster.name}의 진동이 ${target.name}에게 적중하여 ${damage}의 피해를 입혔습니다.`);
     });
     return true;
   },
 },

 SKILL_Echo_of_Silence: {
   id: "SKILL_Echo_of_Silence",
   name: "침묵의 메아리",
   type: "광역 디버프",
   hitArea: [{x:0,y:2},{x:1,y:1},{x:3,y:1},{x:2,y:0},{x:4,y:2},{x:1,y:3},{x:3,y:3}],
   script: `\n<pre>기묘한 울림이 공간을 가른다. \n거대한 풍광을 앞에 두고, 달리 무엇을 말할 수 있겠는가? \n"자연의 숨결 앞에서는 그 어떤 주문도 무의미하다."</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const area = MONSTER_SKILLS.SKILL_Echo_of_Silence.hitArea;
     const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));

     if (hitTargets.length > 0) {
       hitTargets.forEach(t => {
         const duration = hitTargets.length + 1;
         t.addDebuff("silence", "[침묵]", 2, { description: "주문 사용 불가" });
         battleLog(`✦광역 디버프✦ ${caster.name}의 메아리가 ${t.name}에게 적중하여 [침묵]을 부여합니다.`);
       })
     }
     return true;
   },
 },

 SKILL_Crushing_Sky: {
   id: "SKILL_Crushing_Sky",
   name: "무너지는 하늘",
   hitArea: [{x:2,y:0},{x:2,y:1},{x:0,y:2},{x:1,y:2},{x:3,y:2},{x:4,y:2},{x:2,y:3},{x:2,y:4}],
   script: `\n<pre>거대한 석괴가 하늘에서 떨어지기 시작한다. \n때로 자연이라는 것은, 인간에게 이다지도 무자비하다. \n"대지가 너희에게 분노하리라."</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const area = MONSTER_SKILLS.SKILL_Crushing_Sky.hitArea;
     const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));

     hitTargets.forEach(target => {
       const damage = state.calculateDamage(caster, target, 1.2, "physical");
       target.takeDamage(damage, battleLog, caster, allies, enemies, state);
       battleLog(`✦피해✦ 하늘에서 떨어진 석괴가 ${target.name}에게 적중하여 ${damage}의 피해를 입혔습니다.`);
     });
     return true;
   },
 },

 SKILL_Birth_of_Vines: {
   id: "SKILL_Birth_of_Vines",
   name: "덩굴 탄생",
   hitArea: [{x:0,y:0}, {x:0,y:2}, {x:0,y:4}, {x:1,y:1}, {x:1,y:3}, {x:2,y:0}, {x:2,y:2}, {x:2,y:4}, {x:3,y:1}, {x:3,y:3}, {x:4,y:0}, {x:4,y:2}, {x:4,y:4}],
   script: `\n<pre>바닥으로부터 수많은 덩굴이 솟구친다. \n벗어날 수 없는 공포가 당신의 발목을 옥죄어 온다. \n"이 땅에 모습을 드러낸 이들을, 잊지 않겠다."</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const area = MONSTER_SKILLS.SKILL_Birth_of_Vines.hitArea;
     const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));
     hitTargets.forEach(target => {
       const damage = state.calculateDamage(caster, target, 1.2, "magical");
       target.takeDamage(damage, battleLog, caster, allies, enemies, state);
      battleLog(`✦피해✦ 솟구친 덩굴이 ${target.name}의 발목을 옥죄어 ${damage}의 피해를 입혔습니다.`);
     });
     return true;
   },
 },

 SKILL_Spores_of_Silence: {
   id: "SKILL_Spores_of_Silence",
   name: "침묵의 포자",
   type: "광역 디버프",
   hitArea: [
     {x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0},
     {x:0,y:2}, {x:1,y:2}, {x:3,y:2}, {x:4,y:2},
     {x:0,y:4}, {x:1,y:4}, {x:2,y:4}, {x:3,y:4}, {x:4,y:4}
   ],
   script: `\n<pre>고운 꽃가루가 하늘을 뒤덮는다.\n생경한 아름다움은 고요한 찬사만을 강요한다.\n"많은 말은 필요하지 않은 법."</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
        const area = MONSTER_SKILLS.SKILL_Spores_of_Silence.hitArea;
        const hitTargets = allies.filter(t => t.isAlive && area.some(pos => pos.x === t.posX && pos.y === t.posY));
        
        hitTargets.forEach(target => {
            // 1. 무장 해제 디버프 부여
            target.addDebuff('disarm', '[무장 해제]', 2, { description: '공격 스킬 사용 불가' });
            
            // 2. 시전자 공격력 50% 고정 피해 계산
            const fixedDamage = Math.round(caster.getEffectiveStat("atk") * 0.5);
            target.takeDamage(fixedDamage, battleLog, caster);
            
            battleLog(`✦피해✦ ${target.name}에게 포자가 터지며 ${fixedDamage}의 고정 피해를 입히고 무장을 해제합니다.`);
        });
        return true;
    }
},

 SKILL_Seeds_Wrath: {
   id: "SKILL_Seeds_Wrath",
   name: "씨앗의 분노",
   hitArea: [{x:1,y:1}, {x:1,y:2}, {x:1,y:3}, {x:2,y:1}, {x:2,y:3}, {x:3,y:1}, {x:3,y:2}, {x:3,y:3}, {x:0,y:0}, {x:0,y:4}, {x:4,y:0}, {x:4,y:4}],
   script: `\n<pre>고운 꽃가루가 하늘을 뒤덮는다. \n생경한 아름다움은 고요한 찬사만을 강요한다. \n"많은 말은 필요하지 않은 법."</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const greenArea = [{x:1,y:1},{x:1,y:2},{x:1,y:3},{x:2,y:1},{x:2,y:3},{x:3,y:1},{x:3,y:2},{x:3,y:3}];
     const blueArea = [{x:0,y:0},{x:0,y:4},{x:4,y:0},{x:4,y:4}];
     allies.filter(t => t.isAlive).forEach(target => {
       if (greenArea.some(p => p.x === target.posX && p.y === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.5, "magical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state);
       }
       if (blueArea.some(p => p.x === target.posX && p.y === target.posY)) {
         target.addDebuff("disarm", "[무장 해제]", 2, { description: "공격 스킬 사용 불가" });
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
  type: "물리 공격",
  script: `<pre>"하핫! 다, 다들 즐겁지? 응……?"</pre>`,
  description: "뿅망치를 세로로 크게 휘둘러 상하 두 칸씩 피해를 입힙니다.",
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 세로축 오프셋: 상(0,-2), 상(0,-1), 하(0,1), 하(0,2)
    const offsets = [{ dx: 0, dy: -2 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 2 }];
    
    allies.filter(t => t.isAlive).forEach(target => {
      if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
        // 물리 피해 계산 (최소 10의 피해 보장)
        const calculatedDmg = state.calculateDamage(caster, target, 1.0, "physical");
        const finalDmg = Math.max(10, calculatedDmg);
        
        target.takeDamage(finalDmg, battleLog, caster, allies, enemies, state);
        battleLog(`  ✦피해✦ 피에로의 물풍선! ${target.name}에게 ${finalDmg}의 물리 피해.`);

        // [폭주 기믹] duet_enrage 상태일 때 낙인(Brand) 부여
        if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) {
          state.applyRandomBrand(target, battleLog);
        }
      }
    });
    return true;
  }
},

 SKILL_Slapstick_Comdey_C: {
  id: "SKILL_Slapstick_Comdey_C",
  name: "슬랩스틱 코미디(클라운)",
  type: "마법 공격",
  script: `<pre>"와장창! 어때, 어때? 놀랐지?!"</pre>`,
  description: "뿅망치를 가로로 크게 휘둘러 좌우 두 칸씩 피해를 입힙니다.",
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 가로축 오프셋: 좌(-2,0), 좌(-1,0), 우(1,0), 우(2,0)
    const offsets = [{ dx: -2, dy: 0 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }];
    
    allies.filter(t => t.isAlive).forEach(target => {
      if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
        // 마법 피해 계산 (최소 10의 피해 보장)
        const calculatedDmg = state.calculateDamage(caster, target, 1.0, "magical");
        const finalDmg = Math.max(10, calculatedDmg);
        
        target.takeDamage(finalDmg, battleLog, caster, allies, enemies, state);
        battleLog(`  ✦피해✦ 클라운의 뿅망치! ${target.name}에게 ${finalDmg}의 마법 피해.`);

        // [폭주 기믹] duet_enrage 상태일 때 낙인(Brand) 부여
        if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) {
          state.applyRandomBrand(target, battleLog);
        }
      }
    });
    return true;
  }
},

 SKILL_Get_a_Present_C: {
  id: "SKILL_Get_a_Present_C",
  name: "선물 받아!(클라운)",
  type: "마법 공격",
  script: `<pre>"깜~짝 선물 등장이요!"</pre>`,
  description: "대각선 방향 2칸까지 선물을 던져 X자 범위 내의 모든 적에게 마법 피해를 입힙니다.",
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 대각선 X자 오프셋 (1칸 및 2칸)
    const offsets = [
      { dx: -2, dy: -2 }, { dx: -2, dy: 2 },
      { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
      { dx: 1, dy: -1 },  { dx: 1, dy: 1 },
      { dx: 2, dy: -2 },  { dx: 2, dy: 2 }
    ];
    
    allies.filter(t => t.isAlive).forEach(target => {
      if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
        // 마법 피해 계산 (최소 10의 피해 보장)
        const calculatedDmg = state.calculateDamage(caster, target, 1.0, "magical");
        const finalDmg = Math.max(10, calculatedDmg);
        
        target.takeDamage(finalDmg, battleLog, caster, allies, enemies, state);
        battleLog(`  ✦피해✦ 클라운의 물풍선! ${target.name}에게 ${finalDmg}의 마법 피해.`);

        // [폭주 기믹] duet_enrage 상태일 때 낙인(Brand) 부여
        if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) {
          state.applyRandomBrand(target, battleLog);
        }
      }
    });
    return true;
  }
},

 SKILL_Get_a_Present_P: {
  id: "SKILL_Get_a_Present_P",
  name: "선물 받아!(피에로)",
  type: "물리 공격",
  script: `<pre>"깜짝 선물, 줘야 한댔어……."</pre>`,
  description: "파이를 던져 자신 주변 1칸(8방향) 내의 모든 적에게 물리 피해를 입힙니다.",
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 자신을 둘러싼 8방향 오프셋
    const offsets = [
      { dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 },
      { dx: 0, dy: -1 },                      { dx: 0, dy: 1 },
      { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
    ];
    
    allies.filter(t => t.isAlive).forEach(target => {
      if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
        // 물리 피해 계산 (최소 10의 피해 보장)
        const calculatedDmg = state.calculateDamage(caster, target, 1.0, "physical");
        const finalDmg = Math.max(10, calculatedDmg);
        
        target.takeDamage(finalDmg, battleLog, caster, allies, enemies, state);
        battleLog(`  ✦피해✦ 피에로의 파이! ${target.name}에게 ${finalDmg}의 물리 피해.`);

        // [폭주 기믹] duet_enrage 상태일 때 낙인(Brand) 부여
        if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) {
          state.applyRandomBrand(target, battleLog);
        }
      }
    });
    return true;
  }
},

 GIMMICK_Laugh_of: {
  id: "GIMMICK_Laugh_of",
  name: "광대의 웃음",
  type: "기믹",
  script: `<pre>\n\n퍼레이드 음악이 늘어지며 기묘하게 일그러진다.\n협화음 속으로 섬찟한 웃음소리가 들린다.\n"광대는 언제나 감정에 따라 춤을 추지. 함께 웃어 줄래?"\n\n</pre>`,
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 중복 기믹 방지
    if (state.activeGimmickState && state.activeGimmickState.type.startsWith("clown_emotion")) return false;

    battleLog("✦기믹 발생✦ 무대 위로 피에로의 기괴한 웃음소리가 울려 퍼집니다.");

    // 기믹 상태 설정 (3턴 지속)
    state.activeGimmickState = {
      type: "clown_emotion_laugh",
      turnStart: state.currentTurn,
      duration: 3,
      requiredTarget: "클라운", // 집중 공격 대상
      hits: 0,
      requiredHits: 5 // 필요 유효타 수
    };

    // 즉시 효과: 모든 아군에게 [환희 낙인] 부여 시도 (광대 폭주 시 대비)
    allies.filter(a => a.isAlive).forEach(a => {
      const damage = 10;
      a.takeDamage(damage, battleLog, caster);
      battleLog(`  ✦피해✦ 소름 끼치는 웃음소리에 ${a.name}의 정신이 깎입니다.`);
    });

    return true;
  }
},

 GIMMICK_Tears_of: {
  id: "GIMMICK_Tears_of",
  name: "광대의 눈물",
  type: "기믹",
  script: `<pre>\n\n퍼레이드 음악이 늘어지며 기묘하게 일그러진다.\n협화음 속으로 섬찟한 울음소리가 들린다.\n"광대는 언제나 감정에 따라 춤을 추지. 함께 울어 줄래?"\n\n</pre>`,
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 중복 기믹 방지
    if (state.activeGimmickState && state.activeGimmickState.type.startsWith("clown_emotion")) return false;

    battleLog("✦기믹 발생✦ 무대 위로 비명 섞인 피에로의 울음소리가 터져 나옵니다.");

    // 기믹 상태 설정 (3턴 지속)
    state.activeGimmickState = {
      type: "clown_emotion_tear",
      turnStart: state.currentTurn,
      duration: 3,
      requiredTarget: "피에로", // 집중 공격 대상
      hits: 0,
      requiredHits: 5 // 필요 유효타 수
    };

    // 즉시 효과: 모든 아군에게 [우울 낙인] 부여 시도 (광대 폭주 시 대비)
    allies.filter(a => a.isAlive).forEach(a => {
      const damage = 10;
      a.takeDamage(damage, battleLog, caster);
      battleLog(`  ✦피해✦ 비통한 울음소리가 ${a.name}의 행동을 무겁게 짓누릅니다.`);
    });

    return true;
  }
},

 // --- [3] 카르나블룸 스킬 (Stage B) ---
 SKILL_Carnabloom_Playtime: {
  id: "SKILL_Carnabloom_Playtime",
  name: "유희 (기본 공격)",
  script: `<pre>\n\n불꽃의 고리가 무대 위를 전부 태울 듯 회전한다.\n박자를 놓치는 순간, 불길이 당신을 스쳐 간다.\n"집중이 깨지는 순간……. 쉿. 조심해야 해. 다칠지도 모르니."\n\n</pre>`,
  execute: (caster, target, allies, enemies, battleLog, state) => {
    const { currentTurn, calculateDamage } = state;
    const isOdd = currentTurn % 2 === 1;
    
    // 기획: 홀수 발동 시 초록색 범위, 짝수 발동 시 붉은색 범위
    // (여기서는 시각적 로그와 판정 로직으로 구현)
    battleLog(`✦공격✦ 카르나블룸의 유희! ${isOdd ? "[초록색 범위]" : "[붉은색 범위]"}가 전장을 휩씁니다.`);

    // 2페이즈는 9x9 맵이므로 범위 판정이 중요함 (예시: 십자 혹은 부채꼴)
    const hitArea = isOdd ? [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}] : [{dx:-1,dy:-1},{dx:1,dy:1},{dx:-1,dy:1},{dx:1,dy:-1}];

    allies.filter(a => a.isAlive).forEach(a => {
      const isHit = hitArea.some(p => caster.posX + p.dx === a.posX && caster.posY + p.dy === a.posY);
      if (isHit) {
        // 유효타 1~5 기준 마법 피해
        const damage = calculateDamage(caster, a, 1.8, "magical");
        a.takeDamage(damage, battleLog, caster);
        battleLog(`  ✦피해✦ 불타는 원형 고리가 ${a.name}을(를) 스칩니다: ${damage} 피해.`);
      }
    });
    return true;
  }
},

 SKILL_Strings_of_Emotion: {
  id: "SKILL_Strings_of_Emotion",
  name: "감정의 실",
  type: "디버프/제어",
  script: `\n<pre>인형사의 가느다란 손가락이 색색의 리본을 감싸 쥔다.\n그것은 누군가의 의지를, 자아를, 이성을, 손쉽게 조롱한다.\n"기쁨도, 공포도. 모두 내려놓고 나에게 몸을 맡기는 게 어떻겠니."\n\n</pre>`,
  execute: (caster, target, allies, enemies, battleLog, state) => {

    // 살아 있는 아군 중 무작위 2명 선정
    const targets = allies.filter(a => a.isAlive).sort(() => 0.5 - Math.random()).slice(0, 2);

    targets.forEach(t => {
      // 악몽, 환희, 우울 중 하나를 무작위 선택
      const effects = ["nightmare", "brand_joy", "brand_melancholy"];
      const chosenEffect = effects[Math.floor(Math.random() * effects.length)];

      if (chosenEffect === "nightmare") {
         t.addDebuff("nightmare", "[악몽]", 99, {
           isStun: true,
           stacks: 2, // 2회 타격 필요
           description: "행동 불가. 공격을 2회 받아야 해제됩니다."
         });
         battleLog(`  ✦낙인✦ ${t.name}, 실에 묶여 자아를 잃고 [악몽]에 빠집니다.`);
       } else if (chosenEffect === "brand_joy") {
        // [환희 낙인] 부여 (영구, 3중첩)
        t.addDebuff("brand_joy", "[환희 낙인]", 99, {
          maxStacks: 3,
          description: "방어 성능 감소 및 공격 성능 증폭(영구)"
        });
        battleLog(`  ✦낙인✦ ${t.name}, 끓어오르는 [환희]에 몸을 맡깁니다.`);
        
      } else if (chosenEffect === "brand_melancholy") {
        // [우울 낙인] 부여 (영구, 3중첩)
        t.addDebuff("brand_melancholy", "[우울 낙인]", 99, {
          maxStacks: 3,
          description: "공격 성능 감소 및 상성 무효화(영구)"
        });
        battleLog(`  ✦낙인✦ ${t.name}, 깊은 [우울]에 잠겨 무력해집니다.`);
      }
    });

    return true;
  }
},

SKILL_Puppet_Parade: {
  id: "SKILL_Puppet_Parade",
  name: "퍼펫 퍼레이드",
  type: "기믹/이동",
  script: `\n<pre>유려한 손짓이 지나간 곳에는 기묘한 퍼레이드 음악이 울린다.\n멈춰있던 인형들이 태엽 소리를 내며 기괴하게 움직이기 시작한다.\n"나의 아이들아, 손님들을 위해 자리를 옮겨보렴."</pre>\n`,
  execute: (caster, target, allies, enemies, battleLog, state) => {
    battleLog(`✦기믹✦ 카르나 블룸의 명령에 인형들이 일제히 움직입니다!`);

    // 모든 적군(인형들)을 대상으로 반복
    enemies.filter(e => e.isAlive).forEach(unit => {
      let directions = [];
      
      // 1. 유닛 종류에 따른 이동 방향 정의
      if (unit.name.includes("Clown") || unit.name.includes("클라운")) {
        // 상하좌우
        directions = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
      } else if (unit.name.includes("Pierrot") || unit.name.includes("피에로")) {
        // 대각선
        directions = [{x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1}];
      } else {
        return; // 다른 적군은 이동 안 함
      }

      // 2. 가능한 이동 후보지 필터링 (맵 안 + 아군/적군이 없는 곳)
      const possibleMoves = directions.map(d => ({
        x: unit.posX + d.x,
        y: unit.posY + d.y
      })).filter(pos => {
        // 맵 범위 체크 (9x9 기준)
        const isInside = pos.x >= 0 && pos.x < 9 && pos.y >= 0 && pos.y < 9;
        // 해당 위치에 아무도 없는지 체크
        const isOccupied = state.characterPositions[`${pos.x},${pos.y}`];
        return isInside && !isOccupied;
      });

      // 3. 무작위 이동 실행
      if (possibleMoves.length > 0) {
        const nextMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        // 위치 업데이트 (기존 위치 삭제 후 새 위치 등록)
        delete state.characterPositions[`${unit.posX},${unit.posY}`];
        unit.posX = nextMove.x;
        unit.posY = nextMove.y;
        state.characterPositions[`${unit.posX},${unit.posY}`] = unit.id;
        
        // battleLog(`  ✦이동✦ ${unit.name}이(가) (${unit.posX}, ${unit.posY})로 이동했습니다.`);
      }
    });

    return true;
  }
},

 SKILL_Play2: {
   id: "SKILL_Play2",
   name: "유희(2,4타)",
   script: `\n\n<pre>장난감들이 공중에서 빙글빙글 돌며 떨어진다.\n그것들이 불협화음을 이루며 바닥에 닿을 때, 무대는 숨을 멈춘다.\n"그 표정, 무대 위에서 더 보고 싶어. 이리 올라오렴."</pre>\n\n`,
   hitArea: [
     {x:0,y:0}, {x:1,y:1}, {x:2,y:2}, {x:3,y:3}, {x:5,y:5}, {x:6,y:6}, {x:7,y:7}, {x:8,y:8},
     {x:0,y:8}, {x:1,y:7}, {x:2,y:6}, {x:3,y:5}, {x:5,y:3}, {x:6,y:2}, {x:7,y:1}, {x:8,y:0}
   ],
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const area = MONSTER_SKILLS.SKILL_Play2.hitArea;
     
     // 9x9 맵 전체 아군 중 범위 내 대상 필터링
     allies.filter(t => t.isAlive).forEach(target => {
       const isHit = area.some(pos => pos.x === target.posX && pos.y === target.posY);
       
       if (isHit) {
         // state.calculateDamage 인자 순서 준수 (caster, target, multiplier, type)
         const d = state.calculateDamage(caster, target, 1.1, "magical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state);
         battleLog(`✦피해✦ ${target.name}, 화려한 곡예에 휘말려 ${d}의 피해를 입습니다.`);
       }
     });
     return true;
   }
 },

 GIMMICK_Curtain_Call: {
  id: "GIMMICK_Curtain_Call",
  name: "커튼콜 / 앵콜",
  type: "특수 기믹",
  execute: (caster, target, allies, enemies, battleLog, state) => {
    if (caster.isAlive && caster.currentHp > 0) return false;
   
    // 1. 전장에 남은 미니언(피에로, 클라운) 확인
    const minions = enemies.filter(e => e.isAlive && (e.name === "피에로" || e.name === "클라운"));

    if (minions.length > 0) {
      // [커튼콜 발동]
      battleLog(`\n<pre> 마침내 카르나블룸이 장렬하게 쓰러집니다! </pre>`);
      battleLog(`<b>아! 하지만, 아직 공연은 끝나지 않았습니다.</b>`);
      battleLog(`"나의 아이들아, 마지막 장면을 위해 조금 더 힘을 빌려주렴."`);

      // 2. 미니언들의 현재 체력 10%를 바침
      minions.forEach(m => {
        const hpSacrifice = Math.round(m.currentHp * 0.1);
        m.currentHp = Math.max(1, m.currentHp - hpSacrifice);
        battleLog(`  ✦희생✦ ${m.name}의 생명력이 인형사에게로 흘러 들어갑니다.`);
      });

      // 3. 보스 부활 (최대 체력의 40% 복구)
      caster.isAlive = true;
      caster.currentHp = Math.round(caster.maxHp * 0.4);
      
      battleLog(`\n<b>✦앵콜✦ 카르나블룸이 다시 무대 위로 소환되었습니다!</b>`);
      battleLog(`<pre>"자, 관객 여러분. 다시 한번 박수를!"</pre>`);
      battleLog(`<pre>--------------------------------</pre>\n`);

      if (state.displayCharacters) state.displayCharacters();
      return true; // 부활 성공
    } else {
      // 모든 미니언이 처치된 상태면 부활 실패
      battleLog(`\n✦종료✦ 광대들이 모두 사라져, 인형사의 무대가 완전히 막을 내립니다.`);
      return false; // 최종 사망
    }
  }
},



 SKILL_Silence: {
   id: "SKILL_Silence",
   name: "침묵",
   type: "상태 이상",
  script: `\n\n<pre>불협화음은 예고 없이 중단된다.\n인형의 동작은 크게 흔들리고, 무대 위에서 비틀거린다.\n"이건 예정된 장면이 아니야……."</pre>\n\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     battleLog(`✦특수 패턴✦ ${caster.name}가 맹공에 정신을 차리지 못하고 [침묵] 상태에 빠집니다.`);
     caster.addDebuff("groggy", "[침묵](그로기)", 2, { description: "행동 불가 및 받는 피해 증가" });
     return true;
   }
 },

 SKILL_Script_Reversal: {
  id: "SKILL_Script_Reversal",
  name: "대본의 반역",
  type: "기믹/광역 공격",
  script: `\n<pre>무대의 조명이 번뜩이며 시야를 혼란시킨다. \n대본 위에 존재하는 것은, 어느 자리일까.\n"배우는 늘 빛 아래에. 자리를 비우면, 대본은 분노하지."</pre>\n\n`,
  execute: (caster, target, allies, enemies, battleLog, state) => {
   
    
    // 1. 안전 구역(조명 타일) 무작위 선정 (예: 9x9 중 3~4곳)
    const safeZones = [];
    for(let i=0; i<3; i++) {
        safeZones.push({
            x: Math.floor(Math.random() * 9),
            y: Math.floor(Math.random() * 9)
        });
    }

    // 2. 조명 위치 알림
    safeZones.forEach(p => {
        battleLog(`✦조명✦ (${p.x}, ${p.y}) 지점에 스포트라이트가 비춰집니다!`);
    });

    // 3. 판정: 조명 밖의 모든 아군 타격
    allies.filter(a => a.isAlive).forEach(a => {
      const isSafe = safeZones.some(p => p.x === a.posX && p.y === a.posY);
      
      if (!isSafe) {
        // 대미지 + 악몽 부여
        const damage = state.calculateDamage(caster, a, 2.5, "magical");
        a.takeDamage(damage, battleLog, caster);
        
        a.addDebuff("nightmare", "[악몽]", 2, {
          isStun: true,
          description: "행동 불가 및 보스 공격 불가. 피격 시 해제."
        });
        battleLog(`  ✦피해✦ 조명을 벗어난 ${a.name}이 어둠 속에서 [악몽]에 붙잡힙니다!`);
      } else {
        battleLog(`  ✦회피✦ ${a.name}, 빛의 테두리 안에서 무사히 배역을 수행합니다.`);
      }
    });

    return true;
  }
},

SKILL_Dress_Rehearsal: {
  id: "SKILL_Dress_Rehearsal",
  name: "최종 리허설",
  type: "최종 기믹",
  script: `\n\n<pre>무대 위의 모든 시선이 한 곳으로 집중된다.\n이 순간, 당신에게 맡겨진 배역은.\n\n</pre>`,
  execute: (caster, target, allies, enemies, battleLog, state) => {
    
   const roles = ["웃는 자", "우는 자", "흥분한 자", "무표정한 자"];
    
    allies.filter(a => a.isAlive).forEach(a => {
      // 랜덤 역할 부여
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      // 버프로 역할 저장 (조건 판정을 위해)
      a.addBuff("rehearsal_role", `[역할: ${role}]`, 2, {
        roleType: role,
        startPosX: a.posX,
        startPosY: a.posY,
        actionCount: 0, // 해당 턴 행동 횟수 기록용
        description: getRoleDescription(role)
      });
      
      battleLog(`  ✦배역 부여✦ ${a.name}에게 '${role}'의 대본이 전달되었습니다.`);
    });

    // 판정용 상태 저장
    state.activeGimmickState = {
      type: "dress_rehearsal",
      castTurn: state.currentTurn
    };

    return true;
  }
},
  
// --- [4] 맵 기믹 데이터 ---

 GIMMICK_Aegis_of_Earth1: {
   id: "GIMMICK_Aegis_of_Earth1",
   name: "대지의 수호(동)",
   type: "기믹",
   hitArea: [], 
   // 실제 대미지 계산 시 내부적으로만 참조할 좌표 문자열
   coords: "3,1;3,2;3,3;4,0;4,1;4,2;4,3;4,4",
   script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 동쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     // BattleEngine.js가 이 ID를 확인하여 안전지대 판정을 수행합니다.
     caster.activeGimmick = "GIMMICK_Aegis_of_Earth1"; 
     battleLog(`✦기믹✦ ${caster.name}가 동쪽을 향해 포효합니다.`);
     return true;
   },
 },

 GIMMICK_Aegis_of_Earth2: {
   id: "GIMMICK_Aegis_of_Earth2",
   name: "대지의 수호(서)",
   type: "기믹",
   hitArea: [],
   coords: "0,0;0,1;0,2;0,3;0,4;1,1;1,2;1,3",
   script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 서쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     caster.activeGimmick = "GIMMICK_Aegis_of_Earth2";
     battleLog(`✦기믹✦ ${caster.name}가 서쪽을 향해 포효합니다.`);
     return true;
   },
 },

 GIMMICK_Aegis_of_Earth3: {
   id: "GIMMICK_Aegis_of_Earth3",
   name: "대지의 수호(남)",
   type: "기믹",
   hitArea: [],
   coords: "1,3;2,3;3,3;0,4;1,4;2,4;3,4;4,4",
   script: `<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 남쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     caster.activeGimmick = "GIMMICK_Aegis_of_Earth3";
     battleLog(`✦기믹✦ ${caster.name}가 남쪽을 향해 포효합니다.`);
     return true;
   },
 },

 GIMMICK_Aegis_of_Earth4: {
   id: "GIMMICK_Aegis_of_Earth4",
   name: "대지의 수호(북)",
   type: "기믹",
   hitArea: [],
   coords: "0,0;1,0;2,0;3,0;4,0;1,1;2,1;3,1",
   script: `\n<pre>우리가 상대할 것은 대지, 그 자체였을까.\n절벽이 앞을 가로막는다.\n허나 무너뜨릴 수 없을 듯하던 북쪽 성벽 또한 작은 균열 하나에 허물어지는 법.\n"무딘 칼날로 대지를 가를 수 있겠는가?"</pre>\n`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     caster.activeGimmick = "GIMMICK_Aegis_of_Earth4";
     battleLog(`✦기믹✦ ${caster.name}가 북쪽을 향해 포효합니다.`);
     return true;
   },
 },

 GIMMICK_Path_of_Ruin: {
   id: "GIMMICK_Path_of_Ruin",
   name: "균열의 길",
   type: "기믹 예고",
   hitArea: [
     {x:2,y:0}, {x:2,y:1}, {x:2,y:2}, {x:2,y:3}, {x:2,y:4},
     {x:0,y:2}, {x:1,y:2}, {x:3,y:2}, {x:4,y:2}
   ],
   execute: (caster, target, allies, enemies, battleLog, state) => {
        caster.addBuff("path_of_ruin_telegraph", "폭발 예고", 2, {});
        
        // 범위 내 아군에게 [흔적]을 남겨 다음 턴 위험을 예고합니다.
        const area = MONSTER_SKILLS.GIMMICK_Path_of_Ruin.hitArea;
        allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY)).forEach(t => {
            t.addDebuff("ruin_mark", "[균열의 흔적]", 2, { description: "다음 턴 폭발 대미지 대상" });
            battleLog(`✦기믹✦ ${t.name}의 발치에 불길한 균열이 새겨졌습니다.`);
        });
        return true;
    },
},

 SKILL_Ruin_Explosion: {
  id: "SKILL_Ruin_Explosion",
  name: "균열의 폭발",
  execute: (caster, target, allies, enemies, battleLog, state) => {
    // 1. 예고했던 범위(GIMMICK_Path_of_Ruin의 hitArea)를 가져옵니다.
    const area = MONSTER_SKILLS.GIMMICK_Path_of_Ruin.hitArea;
    
    // 2. 해당 범위에 있는 살아있는 아군들을 필터링합니다.
    const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));
    
    if (hitTargets.length > 0) {
      battleLog(`✦기믹✦ 지면에 새겨진 균열이 일제히 터집니다.`);
      hitTargets.forEach(t => {
        // 균열의 흔적(ruin_mark)이 있다면 3.5배, 없다면 기본 1.5배 피해
        const multiplier = t.hasDebuff("ruin_mark") ? 3.5 : 1.5;
        
        const damage = state.calculateDamage(caster, t, multiplier, "magical");
        
        t.takeDamage(damage, battleLog, caster);
        battleLog(`✦피해✦ 폭발의 여파가 ${t.name}에게 ${damage}의 치명적인 피해를 입혔습니다.`);
        
        // 폭발에 적중당했으므로 흔적 제거
        t.removeDebuffById("ruin_mark");
      });
    } else {
      battleLog(`✦정보✦ 균열이 허공에서 터졌습니다. 아무도 피해를 입지 않았습니다.`);
    }
    return true;
  }
},

 GIMMICK_Seed_of_Devour: {
   id: "GIMMICK_Seed_of_Devour",
   name: "흡수의 술식",
   type: "오브젝트 생성",
   script: `\n<pre> 생명의 씨앗들이 고개를 들기 시작한다. \n이 씨앗들이 결실을 맺지 못하도록 꺾어야 한다. \n"씨앗은 생명을 흡수해, 다시 죽음을 틔운다."</pre>`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
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
       battleLog(`✦기믹✦ 맵에 [생명의 열매]가 생성되었습니다.`);
     } else if (gimmickType === 3) {
       const spring = { id: `SPRING_${Date.now()}`, name: "메마른 생명의 샘", type: "spring", posX: 2, posY: 0, isAlive: true, healingReceived: 0, maxHealingRequired: 50 };
       mapObjects.push(spring);
       characterPositions[`2,0`] = spring.id;
       battleLog(`✦기믹✦ [생명의 샘]이 나타났습니다!`);
     }
     return true;
   },
 }
};
