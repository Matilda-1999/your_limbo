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
         t.addDebuff("silence", "[침묵]", 2, { description: `주문 사용 불가` });
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
     const hitTargets = allies.filter(t => t.isAlive && area.some(p => p.x === t.posX && p.y === t.posY));
     if (hitTargets.length > 0) {
       hitTargets.forEach(t => {
         t.addDebuff("disarm", "[무장 해제]", hitTargets.length, { description: "공격 스킬 사용 불가" });
         battleLog(`✦광역 디버프✦ ${t.name}이 포자에 노출되어 무장이 해제됩니다.`);
       });
     }
     return true;
   },
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
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const offsets = [{ dx: 0, dy: -2 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 2 }];
     allies.filter(t => t.isAlive).forEach(target => {
       if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.0, "physical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state);
         if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) state.applyRandomBrand(target);
       }
     });
     return true;
   }
 },

 SKILL_Slapstick_Comdey_C: {
   id: "SKILL_Slapstick_Comdey_C",
   name: "슬랩스틱 코미디(클라운)",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const offsets = [{ dx: -2, dy: 0 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }];
     allies.filter(t => t.isAlive).forEach(target => {
       if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.0, "magical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state);
         if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) state.applyRandomBrand(target);
       }
     });
     return true;
   }
 },

 SKILL_Get_a_Present_P: {
   id: "SKILL_Get_a_Present_P",
   name: "선물 받아!(피에로)",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const offsets = [{dx:-1,dy:-1},{dx:-1,dy:0},{dx:-1,dy:1},{dx:0,dy:-1},{dx:0,dy:1},{dx:1,dy:-1},{dx:1,dy:0},{dx:1,dy:1}];
     allies.filter(t => t.isAlive).forEach(target => {
       if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.0, "physical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state); 
         if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) state.applyRandomBrand(target);
       }
     });
     return true;
   }
 },

 SKILL_Get_a_Present_C: {
   id: "SKILL_Get_a_Present_C",
   name: "선물 받아!(클라운)",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const offsets = [{dx:-2,dy:-2},{dx:-2,dy:2},{dx:-1,dy:-1},{dx:-1,dy:1},{dx:1,dy:-1},{dx:1,dy:1},{dx:2,dy:-2},{dx:2,dy:2}];
     allies.filter(t => t.isAlive).forEach(target => {
       if (offsets.some(o => caster.posX + o.dx === target.posX && caster.posY + o.dy === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.0, "magical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state);
         if (caster.hasBuff("duet_enrage") && state.applyRandomBrand) state.applyRandomBrand(target);
       }
     });
     return true;
   }
 },

 GIMMICK_Laugh_of: {
   id: "GIMMICK_Laugh_of",
   name: "광대의 웃음",
   type: "기믹",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     if (state.activeGimmickState && state.activeGimmickState.type.startsWith("clown_emotion")) return false;
     battleLog("✦기믹 발생✦ 광대가 웃음을 터트립니다.");
     state.activeGimmickState = { type: "clown_emotion_laugh", turnStart: state.currentTurn, duration: 3, clownHits: 0, pierrotHits: 0 };
     return true;
   }
 },

 GIMMICK_Tears_of: {
   id: "GIMMICK_Tears_of",
   name: "광대의 눈물",
   type: "기믹",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     if (state.activeGimmickState && state.activeGimmickState.type.startsWith("clown_emotion")) return false;
     battleLog("✦기믹 발생✦ 광대가 눈물을 흘립니다.");
     state.activeGimmickState = { type: "clown_emotion_tear", turnStart: state.currentTurn, duration: 3, clownHits: 0, pierrotHits: 0 };
     return true;
   }
 },

 // --- [3] 카르나블룸 스킬 (Stage B) ---
 SKILL_Play1: {
   id: "SKILL_Play1",
   name: "유희(1,3,5타)",
   hitArea: [{x:0,y:4},{x:1,y:4},{x:2,y:4},{x:3,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4},{x:8,y:4},{x:4,y:0},{x:4,y:1},{x:4,y:2},{x:4,y:3},{x:4,y:5},{x:4,y:6},{x:4,y:7},{x:4,y:8}],
   execute: (caster, target, allies, enemies, battleLog, state) => {
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

 SKILL_Thread_of_Emotion: {
  id: "SKILL_Thread_of_Emotion",
  name: "감정의 실",
  type: "광역 디버프",
  execute: (caster, allies, enemies, battle_log, state) => {
       if (hitArea.some(pos => pos[0] === target.posX && pos[1] === target.posY)) {
         battleLog(` ↪︎ [감정의 실]이 ${target.name}을(를) 휘감습니다.`);
         target.addDebuff("melancholy_brand", "[우울 낙인]", 99, {});
         target.addDebuff("ecstasy_brand", "[환희 낙인]", 99, {});
         target.addDebuff("nightmare", "[악몽]", 99, {});
       }
     });
     return true;
   }
 },

 SKILL_Play2: {
   id: "SKILL_Play2",
   name: "유희(2,4타)",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const hitArea = "0,0;1,1;2,2;3,3;5,5;6,6;7,7;8,8;0,8;1,7;2,6;3,5;5,3;6,2;7,1;8,0".split(";").map(s => s.split(",").map(Number));
     allies.filter(t => t.isAlive).forEach(target => {
       if (hitArea.some(pos => pos[0] === target.posX && pos[1] === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.1, "magical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state); // 파라미터 수정됨
       }
     });
     return true;
   }
 },

 SKILL_Crimson: {
   id: "SKILL_Crimson",
   name: "진홍",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     const debuffArea = "0,0;0,1;0,2;0,3;0,4;0,5;0,6;0,7;0,8;1,0;1,8;2,0;2,8;3,0;3,8;4,0;4,8;5,0;5,8;6,0;6,8;7,0;7,8;8,0;8,1;8,2;8,3;8,4;8,5;8,6;8,7;8,8;3,3;3,5;5,3;5,5".split(";").map(s => s.split(",").map(Number));
     const damageArea = "1,1;1,7;2,2;2,3;2,5;2,6;3,2;3,4;3,6;4,3;4,5;5,2;5,4;5,6;6,2;6,3;6,5;6,6;7,1;7,7".split(";").map(s => s.split(",").map(Number));
     allies.filter(t => t.isAlive).forEach(target => {
       if (debuffArea.some(pos => pos[0] === target.posX && pos[1] === target.posY)) {
         target.addDebuff("melancholy_brand", "[우울 낙인]", 99, { unremovable: false });
         target.addDebuff("ecstasy_brand", "[환희 낙인]", 99, { unremovable: false });
         target.addDebuff("nightmare", "[악몽]", 99, { unremovable: false });
       }
       if (damageArea.some(pos => pos[0] === target.posX && pos[1] === target.posY)) {
         const d = state.calculateDamage(caster, target, 1.0, "magical");
         target.takeDamage(d, battleLog, caster, allies, enemies, state); // 파라미터 수정됨
       }
     });
     return true;
   }
 },

 SKILL_Silence: {
   id: "SKILL_Silence",
   name: "침묵",
   type: "상태 이상",
   execute: (caster, target, allies, enemies, battleLog, state) => {
     battleLog(`✦특수 패턴✦ ${caster.name}이 맹공에 정신을 차리지 못하고 [침묵] 상태에 빠집니다.`);
     caster.addDebuff("groggy", "[침묵](그로기)", 2, { description: "행동 불가 및 받는 피해 증가" });
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
     battleLog(`✦기믹 발동✦ ${caster.name}가 동쪽 성벽을 세웁니다.`);
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
     battleLog(`✦기믹 발동✦ ${caster.name}가 서쪽 성벽을 세웁니다.`);
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
     battleLog(`✦기믹 발동✦ ${caster.name}가 남쪽 성벽을 세웁니다.`);
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
     battleLog(`✦기믹 발동✦ ${caster.name}가 북쪽 성벽을 세웁니다.`);
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
   script: `<pre>\n"균열이 퍼지며, 땅 아래서 검은 뿌리가 꿈틀댄다.\n 번져오는 재해 앞에서 길을 찾아야 한다.\n생명의 뿌리를 꺾을 수 있다고 믿는가?"\n</pre>`,
   execute: (caster, target, allies, enemies, battleLog, state) => {
     caster.addBuff("path_of_ruin_telegraph", "균열의 길 예고", 2, {});
     battleLog(`✦기믹 발동✦ ${caster.name}이 전장에 깊은 균열을 새깁니다. 다음 턴에 해당 구역에 폭발이 일어납니다.`);
     return true;
   },
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
       battleLog(`✦기믹 발동✦ 맵에 [생명의 열매]가 생성되었습니다.`);
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
