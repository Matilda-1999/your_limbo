export const SKILLS = {
  // [근성]
  SKILL_RESILIENCE: {
    id: "SKILL_RESILIENCE",
    name: "근성",
    type: "어그로",
    description:
      "원래 연극은 대사를 고르게 나누지 않는다. … 잠깐. 또 너야?<br><br>홀수 턴에는 [철옹성]을, 짝수 턴에는 [의지]를 획득. <br><br>[철옹성]: (자신에게 현재 체력의 2배 + 방어력 2배)만큼의 보호막 부여. 해당 턴에 발생한 모든 아군의 감소한 체력을 대신 감소. 3턴 유지. <br>[의지]: 자신에게 (해당 전투에서 시전 턴까지 받은 대미지의 총 합 * 2.5배)만큼의 보호막을 부여. 이후 [의지] 버프가 해제될 때에 남아 있는 보호막만큼을 자신의 체력으로 흡수. 3턴 유지. 단, [의지] 버프가 해제되면 그동안 받은 대미지의 총합을 초기화.",
    targetType: "self",
    targetSelection: "self",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { currentTurn } = state;

      if (currentTurn % 2 === 1) {
        // 홀수 턴: 철옹성
        const shieldAmount = Math.round(
          caster.currentHp * 2.0 + caster.def * 2.0
        );
        caster.removeBuffById("iron_fortress");
        caster.addBuff("iron_fortress", "[철옹성]", 3, {
          description: "자신에게 보호막 부여. 3턴간 아군 피해 대신 받음.",
          shieldAmount: shieldAmount,
          redirectAllyDamage: true,
        });
        battleLog(
          `✦스킬✦ ${
            caster.name
          }, [근성](홀수) 사용: [철옹성] 효과 발동. 보호막 +${shieldAmount} (3턴). (현재 총 보호막: ${caster.shield.toFixed(
            0
          )})`
        );
      } else {
        // 짝수 턴: 의지
        const damageTaken = caster.totalDamageTakenThisBattle;
        const shieldAmount = Math.round(damageTaken * 2.5);
        caster.removeBuffById("will_buff");
        caster.addBuff("will_buff", "[의지]", 3, {
          description:
            "받은 총 피해 비례 보호막. 해제 시 남은 보호막만큼 체력 흡수 및 받은 피해 총합 초기화.",
          shieldAmount: shieldAmount,
          healOnRemove: true,
          resetsTotalDamageTaken: true,
        });
        battleLog(
          `✦스킬✦ ${
            caster.name
          }, [근성](짝수) 사용: [의지] 효과 발동. (받은 피해: ${damageTaken}) 보호막 +${shieldAmount} (3턴). (현재 총 보호막: ${caster.shield.toFixed(
            0
          )})`
        );
      }
      return true;
    },
  },

// [반격]
  SKILL_COUNTER: {
    id: "SKILL_COUNTER",
    name: "반격",
    type: "카운터",
    description: "보호막을 분배하고 턴에 따라 [응수] 또는 [격노] 태세를 취합니다.",
    targetType: "self",
    targetSelection: "self",
    cooldown: 2,
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { currentTurn } = state;
      const skillId = "SKILL_COUNTER";
      const skillName = "반격";

      // 쿨타임 체크
      const lastUsed = caster.lastSkillTurn[skillId] || 0;
      if (lastUsed !== 0 && currentTurn - lastUsed < 2) { // cooldown: 2
        battleLog(`✦정보✦ ${caster.name}, [${skillName}] 사용 불가: 쿨타임 ${2 - (currentTurn - lastUsed)}턴 남음.`);
        return false;
      }

      // 보호막 분배 로직
      const baseShield = caster.shield;
      if (baseShield > 0) {
        const livingAllies = allies.filter((a) => a.isAlive);
        if (livingAllies.length > 0) {
          const shieldPerAlly = Math.round(baseShield / livingAllies.length);
          battleLog(`✦효과✦ ${caster.name}, [${skillName}]의 보호막 분배: 아군 ${livingAllies.length}명에게 보호막 부여.`);
          livingAllies.forEach((ally) => {
            const buffId = `counter_shield_${caster.id}_to_${ally.id}_${currentTurn}`;
            ally.addBuff(buffId, "[반격 보호막]", 2, { shieldAmount: shieldPerAlly });
          });
          caster.shield = 0;
        }
      }

      // 태세 전환 로직 (홀수/짝수 턴)
      caster.removeBuffById("riposte_stance");
      caster.removeBuffById("fury_stance");

      if (currentTurn % 2 === 1) {
        caster.addBuff("riposte_stance", "[응수]", 1, {
          description: "자신 피격 시 단일 반격(1.5배), 아군 피격 시 단일 반격(0.5배).",
        });
        battleLog(`✦스킬✦ ${caster.name}, [반격](홀수) 사용: [응수] 태세 돌입.`);
      } else {
        caster.addBuff("fury_stance", "[격노]", 2, {
          description: "자신 피격 시 모든 적 반격(1.5배), 아군 피격 시 모든 적 반격(0.5배).",
        });
        battleLog(`✦스킬✦ ${caster.name}, [반격](짝수) 사용: [격노] 태세 돌입.`);
      }

      caster.lastSkillTurn[skillId] = currentTurn;
      return true;
    },
  },

  // [도발]
  SKILL_PROVOKE: {
    id: "SKILL_PROVOKE",
    name: "도발",
    type: "어그로",
    description: "받는 피해가 감소하고 모든 적의 타겟을 자신으로 고정합니다.",
    targetType: "self",
    targetSelection: "self",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      caster.addBuff("provoke_damage_reduction", "피해 감소 (도발)", 1, {
        damageReduction: 0.7,
      });
      enemies.filter((e) => e.isAlive).forEach((enemy) => {
        enemy.addDebuff("provoked", "도발 (타겟 고정)", 2, {
          targetId: caster.id,
        });
      });
      caster.aggroDamageStored = 0;
      battleLog(`✦효과✦ ${caster.name}, [도발] 사용: 모든 적을 도발하고 피해 감소 효과를 얻습니다.`);
      return true;
    },
  },

  // [역습]
  SKILL_REVERSAL: {
    id: "SKILL_REVERSAL",
    name: "역습",
    type: "카운터",
    description: "체력을 소모하여 다음 공격에 대한 강력한 반격을 준비합니다.",
    targetType: "self",
    targetSelection: "self",
    cooldown: 2,
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { currentTurn } = state;
      const skillId = "SKILL_REVERSAL";

      const lastUsed = caster.lastSkillTurn[skillId] || 0;
      if (lastUsed !== 0 && currentTurn - lastUsed < 2) {
        battleLog(`✦정보✦ ${caster.name}, [역습] 사용 불가: 쿨타임 ${2 - (currentTurn - lastUsed)}턴 남음.`);
        return false;
      }

      const hpLoss = Math.round(caster.currentHp * 0.5);
      caster.currentHp = Math.max(1, caster.currentHp - hpLoss);
      
      battleLog(`✦소모✦ ${caster.name}, [역습] 준비: 체력 ${hpLoss} 소모. (HP: ${caster.currentHp.toFixed(0)})`);
      
      caster.addBuff("reversal_active", "역습 대기", 1, {});
      caster.lastSkillTurn[skillId] = currentTurn;
      return true;
    },
  },

// [허상]
  SKILL_ILLUSION: {
    id: "SKILL_ILLUSION",
    name: "허상",
    type: "지정 버프",
    description: "자신에겐 회복을, 아군에겐 조건부 공격력 증폭을 부여합니다. 턴 종료 시 추가 공격을 수행합니다.",
    targetType: "single_ally_or_self",
    targetSelection: "ally_or_self",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { currentTurn, applyHeal } = state;

      if (!target) {
        battleLog(`✦정보✦ ${caster.name} [허상]: 스킬 대상을 찾을 수 없습니다.`);
        return false;
      }

      // 1. 사용 조건 체크: 첫 턴에 다른 아군에게 사용 불가
      if (caster.id !== target.id && currentTurn <= 1) {
        battleLog(`✦정보✦ ${caster.name} [허상]: 첫 턴에는 다른 아군에게 사용할 수 없습니다.`);
        return false;
      }

      // 2. 효과 적용
      if (caster.id === target.id) {
        // 자신에게 사용 시 회복
        let healAmount = Math.round(caster.getEffectiveStat("atk") * 0.5);
        applyHeal(caster, healAmount, battleLog, "허상");
      } else {
        // 다른 아군에게 사용 시 체력 소모 및 버프 부여
        const hpLoss = Math.round(caster.getEffectiveStat("atk") * 0.2);
        caster.currentHp = Math.max(1, caster.currentHp - hpLoss);
        battleLog(`✦소모✦ ${caster.name}, [허상] 사용: 체력 ${hpLoss} 소모. (HP: ${caster.currentHp.toFixed(0)})`);

        // 받은 피해 총합의 홀짝에 따라 버프 종류 결정
        const totalDamageTaken = caster.totalDamageTakenThisBattle;
        if (totalDamageTaken % 2 === 0) {
          target.addBuff("illusion_matk_boost", "마법 공격력 증가 (허상)", 2, {
            type: "matk_boost_multiplier",
            value: 2.0,
          });
          battleLog(`✦버프✦ ${target.name}: [허상 효과] 마법 공격력 2배 증가 (2턴).`);
        } else {
          target.addBuff("illusion_atk_boost", "공격력 증가 (허상)", 2, {
            type: "atk_boost_multiplier",
            value: 2.0,
          });
          battleLog(`✦버프✦ ${target.name}: [허상 효과] 공격력 2배 증가 (2턴).`);
        }
      }

      // 3. 턴 종료 추가 공격 예약
      const firstAliveEnemy = enemies.find((e) => e.isAlive);
      if (firstAliveEnemy) {
        caster.addBuff("illusion_end_turn_attack", "턴 종료 추가 공격 (허상)", 1, {
          attackerId: caster.id,
          originalTargetId: target.id,
          enemyTargetId: firstAliveEnemy.id,
          power: 0.5,
          damageType: "physical",
        });
      }

      caster.checkSupporterPassive(battleLog);
      return true;
    },
  },

  // [허무]
  SKILL_NIHILITY: {
    id: "SKILL_NIHILITY",
    name: "허무",
    type: "지정 버프",
    description: "아군의 디버프를 정화하고 무작위 이로운 효과를 부여합니다.",
    targetType: "single_ally",
    targetSelection: "ally",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      if (!target) {
        battleLog(`✦정보✦ ${caster.name} [허무]: 스킬 대상을 찾을 수 없습니다.`);
        return false;
      }
      battleLog(`✦스킬✦ ${caster.name}, ${target.name}에게 [허무] 사용: 디버프 정화 및 랜덤 버프 부여.`);

      // 1. 디버프 정화 로직 (랜덤 2개)
      const removableCategories = ["상태 이상", "제어", "속성 감소"];
      const removableDebuffs = target.debuffs.filter((d) =>
        removableCategories.includes(d.effect.category || "기타")
      );
      
      // 피셔-예이츠 셔플로 랜덤 정화 대상 선정
      for (let i = removableDebuffs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [removableDebuffs[i], removableDebuffs[j]] = [removableDebuffs[j], removableDebuffs[i]];
      }

      const toRemove = removableDebuffs.slice(0, 2);
      toRemove.forEach(debuff => {
        target.removeDebuffById(debuff.id);
        battleLog(`✦정화✦ ${target.name}: [${debuff.name}] 디버프 정화됨.`);
      });

      if (removableDebuffs.length === 0) {
        battleLog(`✦정보✦ ${target.name}: 정화할 수 있는 디버프가 없습니다.`);
      }

      // 2. 랜덤 버프 부여
      const buffChoices = [
        {
          id: "nihility_heal_hot",
          name: "턴 시작 시 HP 회복 (허무)",
          effect: { type: "turn_start_heal", value: Math.round(caster.getEffectiveStat("atk") * 0.5) },
        },
        {
          id: "nihility_reflect_dmg",
          name: "피해 반사 (허무)",
          effect: { type: "damage_reflect", value: 0.3 },
        },
        {
          id: "nihility_def_boost",
          name: "방어력 증가 (허무)",
          effect: { type: "def_boost_multiplier", value: 1.3 },
        },
        {
          id: "nihility_atk_boost",
          name: "공격력 증가 (허무)",
          effect: { type: "atk_boost_multiplier", value: 1.5 },
        },
      ];
      
      const chosen = buffChoices[Math.floor(Math.random() * buffChoices.length)];
      target.addBuff(chosen.id, chosen.name, 2, chosen.effect);
      battleLog(`✦버프✦ ${target.name}: [허무] 효과로 [${chosen.name}] 획득(2턴).`);

      caster.checkSupporterPassive(battleLog);
      return true;
    },
  },

// [실존]
  SKILL_REALITY: {
    id: "SKILL_REALITY",
    name: "실존",
    type: "광역 버프",
    description: "모든 아군의 방어력을 강화하고 자신에게 [실재] 스택을 부여합니다. 3턴 연속 사용은 불가능합니다.",
    targetType: "all_allies",
    targetSelection: "all_allies",
    execute: (caster, allies, enemies, battleLog, state) => {
      const { currentTurn } = state;
      const skillId = "SKILL_REALITY";
      
      // 1. 연속 사용 제한 체크
      const realityBuff = caster.buffs.find((b) => b.id === "reality_stacks");
      const prevConsecutiveCount = (realityBuff && realityBuff.lastAppliedTurn === currentTurn - 1) 
        ? (realityBuff.consecutiveCount || 1) 
        : 0;

      if (prevConsecutiveCount >= 2) {
        battleLog(`✦정보✦ ${caster.name}: [실존]을 3턴 연속 사용할 수 없습니다.`);
        return false;
      }

      battleLog(`✦스킬✦ ${caster.name}, [실존] 사용: 모든 아군에게 [실재] 효과를 부여합니다.`);

      // 2. 스택 및 연속 사용 횟수 결정
      let realityStacks = 4;
      let newConsecutiveCount = 1;
      if (prevConsecutiveCount > 0) {
        realityStacks = 6;
        newConsecutiveCount = prevConsecutiveCount + 1;
        battleLog(`✦효과✦ ${caster.name} [실존] 연속 사용: [실재] 6스택 효과 적용.`);
      }

      // 3. 아군 전체 버프 적용
      allies.filter(a => a.isAlive).forEach(ally => {
        // 기본 방어/마방 30% 증가
        ally.addBuff("reality_base_def_boost", "[실존] 기본 강화(물리)", 2, { type: "def_boost_multiplier", value: 1.3 });
        ally.addBuff("reality_base_mdef_boost", "[실존] 기본 강화(마법)", 2, { type: "mdef_boost_multiplier", value: 1.3 });

        // 실재 보너스 수치 계산 (강화된 수치 기준)
        const baseStat = Math.max(ally.getEffectiveStat('def'), ally.getEffectiveStat('mdef'));
        const boostValue = baseStat * 0.2 * realityStacks;
        
        ally.addBuff("reality_ally_boost", "[실재]", 2, { type: "reality_boost", value: boostValue }, false); 
        battleLog(`✦버프✦ ${ally.name}: 방어 능력 강화 및 [실재] 보너스 +${Math.round(boostValue)} (2턴).`);
      });

      // 4. 시전자 스택 갱신
      caster.addBuff("reality_stacks", "[실재 스택]", 2, {
        stacks: realityStacks,
        unremovable: true,
        lastAppliedTurn: currentTurn,
        consecutiveCount: newConsecutiveCount
      }, true);

      caster.lastSkillTurn[skillId] = currentTurn;
      caster.checkSupporterPassive(battleLog);
      return true;
    },
  },

  // [진리]
  SKILL_TRUTH: {
    id: "SKILL_TRUTH",
    name: "진리",
    type: "광역 디버프",
    description: "모든 적에게 [중독]을 부여하고 턴 종료 시 추가 공격을 예약합니다.",
    targetType: "all_enemies",
    targetSelection: "all_enemies",
    execute: (caster, enemies, battleLog) => {
      battleLog(`✦스킬✦ ${caster.name}, [진리] 사용: 모든 적에게 [중독]을 부여합니다.`);

      enemies.filter((e) => e.isAlive).forEach((enemy) => {
        const poisonDamage = enemy.currentHp * 0.015;
        enemy.addDebuff("poison_truth", "[중독](진리)", 2, {
          damagePerTurn: poisonDamage,
          type: "fixed",
          casterId: caster.id,
          category: "상태 이상",
        });
        battleLog(`✦상태 이상✦ ${enemy.name}, [중독](진리) 효과 적용(2턴).`);
      });

      // 턴 종료 후 추가 공격 마커
      caster.addBuff("truth_end_turn_attack_marker", "맹독 추가 공격 대기", 1, {
        originalCasterId: caster.id,
        power: 0.3,
      });
      return true;
    },
  },

  // [서막]
  SKILL_OVERTURE: {
    id: "SKILL_OVERTURE",
    name: "서막",
    type: "단일 공격",
    description: "적에게 물리/마법 피해를 가하고 [흠집]을 새깁니다.",
    targetType: "single_enemy",
    targetSelection: "enemy",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { calculateDamage } = state;
      if (!target || !target.isAlive) return false;

      // 1. 데미지 계산 및 적용
      const atk = caster.getEffectiveStat("atk");
      const matk = caster.getEffectiveStat("matk");
      const damageType = atk >= matk ? "physical" : "magical";
      const skillPower = damageType === "physical" ? 2.0 : 2.5;
      
      const damage = calculateDamage(caster, target, skillPower, damageType);
      target.takeDamage(damage, battleLog, caster);
      battleLog(`✦피해✦ ${caster.name}, [서막]: ${target.name}에게 ${damage} ${damageType === "physical" ? "물리" : "마법"} 피해.`);

      // 2. 타입에 따른 감소 방어력 결정
      let defenseToReduce;
      if (caster.type === "암석" || caster.type === "야수") defenseToReduce = "def";
      else if (caster.type === "천체" || caster.type === "나무") defenseToReduce = "mdef";
      else defenseToReduce = (damageType === "physical") ? "def" : "mdef";

      // 3. [흠집] 디버프 부여
      target.addDebuff("scratch", "[흠집]", 2, {
        maxStacks: 3,
        overrideDuration: true,
        removerSkillId: "SKILL_CLIMAX", // 다음 스킬 연계 아이디
        category: "표식",
        reductionType: defenseToReduce,
        reductionValue: 0.1,
      });

      const scratchStacks = target.getDebuffStacks("scratch");
      battleLog(`✦디버프✦ ${target.name}, [흠집] (${defenseToReduce === "def" ? "방어력" : "마법 방어력"} 감소) 적용. (현재 ${scratchStacks}스택).`);

      return true;
    },
  },

// [절정]
  SKILL_CLIMAX: {
    id: "SKILL_CLIMAX",
    name: "절정",
    type: "단일 공격",
    description: "시전자의 타입에 따라 강력한 피해를 입힙니다. 대상에게 [흠집]이 있다면 추가 공격을 가합니다.",
    targetType: "single_enemy",
    targetSelection: "enemy",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { calculateDamage } = state;
      if (!target || !target.isAlive) return false;

      // 1. 공격 스탯 및 데미지 타입 결정
      let statTypeToUse;
      let damageType;
      if (caster.type === "암석" || caster.type === "야수") {
        statTypeToUse = "atk";
        damageType = "physical";
      } else if (caster.type === "천체" || caster.type === "나무") {
        statTypeToUse = "matk";
        damageType = "magical";
      } else {
        statTypeToUse = caster.getEffectiveStat("atk") >= caster.getEffectiveStat("matk") ? "atk" : "matk";
        damageType = statTypeToUse === "atk" ? "physical" : "magical";
      }
      const damageTypeKorean = damageType === "physical" ? "물리" : "마법";

      // 2. 메인 공격 수행
      battleLog(`✦스킬✦ ${caster.name}, ${target.name}에게 [절정] 공격.`);
      const mainDamage = calculateDamage(caster, target, 2.7, damageType, statTypeToUse);
      target.takeDamage(mainDamage, battleLog, caster);
      battleLog(`  ✦피해✦ [절정]: ${target.name}에게 ${mainDamage} ${damageTypeKorean} 피해.`);

      if (!target.isAlive) return true;

      // 3. [흠집] 연계 추가 공격
      const scratchStacks = target.getDebuffStacks("scratch");
      if (scratchStacks > 0) {
        battleLog(`✦효과✦ ${target.name} [흠집 ${scratchStacks}스택]: 추가타 발생.`);
        let bonusPower = 0.25;
        if (scratchStacks === 2) bonusPower = 0.35;
        else if (scratchStacks >= 3) bonusPower = 0.45;

        for (let i = 0; i < 2; i++) {
          const bonusDamage = calculateDamage(caster, target, bonusPower, damageType, statTypeToUse);
          target.takeDamage(bonusDamage, battleLog, caster);
          battleLog(`  ✦추가 피해✦ [흠집 효과] ${i + 1}회: ${target.name}에게 ${bonusDamage} 추가 ${damageTypeKorean} 피해.`);
          if (!target.isAlive) break;
        }

        if (target.isAlive) target.removeDebuffById("scratch");
        battleLog(`✦정보✦ ${target.name}: [흠집] 효과 소멸.`);
      }
      return true;
    },
  },

// [간파]
  SKILL_DISCERNMENT: {
    id: "SKILL_DISCERNMENT",
    name: "간파",
    type: "단일 공격",
    description: "관통율 30%가 적용된 2연타 공격 후, 추가 피해를 입히고 [쇠약] 상태를 부여합니다.",
    targetType: "single_enemy",
    targetSelection: "enemy",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { calculateDamage } = state;
      if (!target || !target.isAlive) return false;

      const damageType = caster.getEffectiveStat("atk") >= caster.getEffectiveStat("matk") ? "physical" : "magical";
      const damageTypeKorean = damageType === "physical" ? "물리" : "마법";

      battleLog(`✦스킬✦ ${caster.name}, ${target.name}에게 [간파]] 발동.`);

      // 1. 관통 2연타 (방어력 30% 무시로 0데미지 방지)
      // 원본 위력인 2.6을 2타로 나누어 각 1.3씩 적용
      for (let i = 0; i < 2; i++) {
        const d1 = calculateDamage(caster, target, 1.3, damageType, null, { penetration: 0.3 });
        target.takeDamage(d1, battleLog, caster);
        battleLog(`✦피해✦ [간파] ${i + 1}타: ${target.name}에게 ${d1} ${damageTypeKorean} 피해.`);
        if (!target.isAlive) return true;
      }

      // 2. 추가 피해 (기존 로직 200% 유지)
      const d2 = calculateDamage(caster, target, 2.0, damageType);
      target.takeDamage(d2, battleLog, caster);
      battleLog(`✦추가 피해✦ ${caster.name} [간파 효과]: ${target.name}에게 ${d2} 추가 ${damageTypeKorean} 피해.`);
      
      if (!target.isAlive) return true;

      // 3. [쇠약] 디버프 부여
      target.addDebuff("weakness", "[쇠약]", 2, {
        damageMultiplierReduction: 0.2,
        category: "상태 이상",
      });
      battleLog(`✦상태 이상✦ ${target.name}, [쇠약] 효과 적용 (2턴).`);
      
      return true;
    },
  },

  // [파열] - 이 버전을 남기세요
SKILL_RUPTURE: {
  id: "SKILL_RUPTURE",
  name: "파열",
  type: "광역 공격",
  // 팁: 두 번째 버전의 멋진 설명을 여기에 합칠 수 있습니다.
  description: "균열은 가장 고요한 순간에 일어난다.<br><br>주 목표와 주변 적들에게 피해를 입힙니다. [쇠약] 상태인 적에게는 추가 고정 피해를 입힙니다.",
  targetType: "single_enemy",
  targetSelection: "enemy",
  cooldown: 2,
  execute: (caster, mainTarget, allies, enemies, battleLog, state) => {
    const { currentTurn, calculateDamage } = state; // state를 통해 안전하게 데이터 참조
    const skillId = "SKILL_RUPTURE";

    if (!mainTarget || !mainTarget.isAlive) return false;

    // 쿨타임 체크 및 남은 턴 계산 로직
      const lastUsed = caster.lastSkillTurn[skillId] || 0;
      if (lastUsed !== 0 && currentTurn - lastUsed < cooldown) {
        const remainingTurns = cooldownPeriod - (currentTurn - lastUsed);
        battleLog(`✦정보✦ ${caster.name}, [파열] 사용 불가: 쿨타임 ${remainingTurns}턴 남음.`);
        return false;
      }

    // 캐릭터 타입에 따른 스탯 결정 로직
    let statType = (caster.type === "암석" || caster.type === "야수") ? "atk" : "matk";
    let damageType = statType === "atk" ? "physical" : "magical";
    const damageTypeKr = damageType === "physical" ? "물리" : "마법";

    battleLog(`✦스킬✦ ${caster.name}, [파열] 사용. 주 대상: ${mainTarget.name}.`);

    // 1. 주 대상 공격 (210%)
    const dMain = calculateDamage(caster, mainTarget, 2.1, damageType, statType);
    mainTarget.takeDamage(dMain, battleLog, caster);
    battleLog(`  ✦피해✦ [파열 주 대상] ${mainTarget.name}: ${dMain} ${damageTypeKr} 피해.`);

    // 쇠약 상태 고정 피해 (30%)
    if (mainTarget.isAlive && mainTarget.hasDebuff("weakness")) {
      const bonus = calculateDamage(caster, mainTarget, 0.3, "fixed", statType);
      mainTarget.takeDamage(bonus, battleLog, caster);
      battleLog(`  ✦추가 피해✦ ${mainTarget.name} ([쇠약] 대상): ${bonus} 추가 고정 피해.`);
    }

    // 2. 부가 대상 공격 (140%)
    const subTargets = enemies.filter(e => e.isAlive && e.id !== mainTarget.id);
    subTargets.forEach(sub => {
      const dSub = calculateDamage(caster, sub, 1.4, damageType, statType);
      sub.takeDamage(dSub, battleLog, caster);
      battleLog(`    ✦피해✦ [파열 부 대상] ${sub.name}: ${dSub} ${damageTypeKr} 피해.`);

      if (sub.isAlive && sub.hasDebuff("weakness")) {
        const bSub = calculateDamage(caster, sub, 0.3, "fixed", statType);
        sub.takeDamage(bSub, battleLog, caster);
        battleLog(`    ✦추가 피해✦ ${sub.name} ([쇠약] 대상): ${bSub} 추가 고정 피해.`);
      }
    });

    caster.lastSkillTurn[skillId] = currentTurn;
    return true;
  },
},

// [공명]
  SKILL_RESONANCE: {
    id: "SKILL_RESONANCE",
    name: "공명",
    type: "지정 버프",
    description: "대상의 체력을 회복하고 모든 상태 이상을 정화합니다. 기믹 오브젝트와 상호작용할 수 있습니다.",
    targetType: "single_ally_or_gimmick",
    targetSelection: "single_ally_or_gimmick",
    execute: (caster, target, allies, enemies, battleLog, state) => {
      const { applyHeal, displayCharacters } = state;
      if (!target) return false;

      // 1. 기믹 오브젝트(메마른 생명의 샘) 상호작용
      if (target.type === "spring") {
        const healAmount = Math.round(caster.getEffectiveStat("def") * 2);
        target.healingReceived += healAmount;
        battleLog(`✦스킬✦ ${caster.name}, [${target.name}]에 [공명] 사용. 생명력 ${healAmount} 주입.`);
        if (displayCharacters) displayCharacters(); 
        return true;
      }

      if (!target.isAlive) return false;

      // 2. 아군 회복 및 정화
      const lostHp = target.maxHp - target.currentHp;
      let healAmount = Math.round(lostHp * 0.5);

      // 힐러 직군 보너스
      if (caster.job === "힐러" && caster.currentHp <= caster.maxHp * 0.5 && (caster.healerBoostCount || 0) < 2) {
        healAmount = Math.round(healAmount * 1.1);
        caster.healerBoostCount = (caster.healerBoostCount || 0) + 1;
        battleLog(`✦직군 효과✦ [은총의 방패] 발동. 회복량 10% 증가.`);
      }

      applyHeal(target, healAmount, battleLog, "공명");

      if (target.debuffs.length > 0) {
        target.debuffs = [];
        battleLog(`✦정화✦ ${target.name}: 모든 디버프가 제거되었습니다.`);
      }

      // 3. [환원] 버프 부여
      caster.addBuff("restoration", "[환원]", 3, {
        description: "스킬 시전 시 체력이 가장 낮은 아군 추가 회복.",
        healPower: Math.round(caster.getEffectiveStat("def") * 0.6),
      });

      caster.checkSupporterPassive(battleLog);
      return true;
    },
  },

  // [보상]
  SKILL_COMPENSATION: {
    id: "SKILL_COMPENSATION",
    name: "보상",
    type: "지정 디버프",
    description: "자신의 체력을 소모하여 적에게 [전이]를 부여합니다. [전이] 상태인 적 공격 시 공격자가 회복됩니다.",
    targetType: "single_enemy",
    targetSelection: "enemy",
    execute: (caster, target, allies, enemies, battleLog) => {
      if (!target || !target.isAlive) return false;

      // 1. 시전자 체력 소모 (최대 체력의 15%)
      const selfDamage = Math.round(caster.maxHp * 0.15);
      caster.takeDamage(selfDamage, battleLog, null);
      battleLog(`✦소모✦ ${caster.name}: 스킬 대가로 ${selfDamage}의 피해를 입습니다.`);

      if (!caster.isAlive) return true;

      // 2. 적에게 [전이] 디버프 부여
      target.addDebuff("transfer", "[전이]", 2, {
        description: "피격 시 공격자를 (자신의 공격력x100%)만큼 회복시킴.",
        casterId: caster.id,
      });
      battleLog(`✦디버프✦ ${target.name}: [전이] 상태 부여 (2턴).`);

      return true;
    },
  },

  // [침전]
  SKILL_SEDIMENTATION: {
    id: "SKILL_SEDIMENTATION",
    name: "침전",
    type: "광역 버프",
    description: "자신의 체력을 소모하여 아군 전체를 대폭 회복시키고 [면역]을 부여합니다.",
    targetType: "all_allies",
    targetSelection: "all_allies",
    execute: (caster, allies, enemies, battleLog, state) => {
      const { applyHeal, displayCharacters, mapObjects } = state;
      
      const hpCost = Math.round(caster.maxHp * 0.2);
      caster.currentHp = Math.max(1, caster.currentHp - hpCost);
      battleLog(`✦소모✦ ${caster.name}: 체력 ${hpCost}을 소모하여 아군을 구원합니다.`);

      // 1. 아군 전체 회복 및 면역
      allies.filter((a) => a.isAlive && a.id !== caster.id).forEach((ally) => {
        const lostHp = ally.maxHp - ally.currentHp;
        if (lostHp > 0) {
          applyHeal(ally, Math.round(lostHp * 0.7), battleLog, "침전");
        }
        ally.addBuff("immunity", "[면역]", 2, { singleUse: true });
        battleLog(`✦버프✦ ${ally.name}: [면역](1회) 획득.`);
      });

      // 2. 기믹 오브젝트 연동
      const spring = (mapObjects || []).find((obj) => obj.type === "spring");
      if (spring) {
        spring.healingReceived += hpCost;
        battleLog(`✦기믹✦ [${spring.name}]에 생명력 ${hpCost} 주입.`);
      }

      caster.checkSupporterPassive(battleLog);
      if (displayCharacters) displayCharacters();
      return true;
    },
  },

  // [차연]
  SKILL_DIFFERANCE: {
    id: "SKILL_DIFFERANCE",
    name: "차연",
    type: "광역 버프",
    description: "체력을 소모하여 자신을 회복하고 적에게 피해를 입히며, 아군에게 [흔적]을 남깁니다.",
    targetType: "all_allies",
    targetSelection: "all_allies",
    execute: (caster, allies, enemies, battleLog, state) => {
      const { applyHeal } = state;

      // 1. 시전자 코스트 및 적군 고정 피해
      const selfCost = Math.round(caster.currentHp * 0.15);
      caster.takeDamage(selfCost, battleLog, null);
      
      if (!caster.isAlive) return true;

      const enemyDamage = Math.round(caster.currentHp * 0.10);
      enemies.filter(e => e.isAlive).forEach(enemy => {
        enemy.takeDamage(enemyDamage, battleLog, caster);
      });
      battleLog(`✦스킬✦ [차연]의 여파가 적들에게 전해졌습니다.`);

      // 2. 시전자 회복 및 아군 [흔적] 부여
      applyHeal(caster, Math.round(caster.maxHp * 0.3), battleLog, "차연");

      allies.filter(a => a.isAlive).forEach(ally => {
        ally.addBuff("trace", "[흔적]", 3, {
          description: "체력 50% 이하 피격 시 시전자가 희생하여 회복시킴.",
          originalCasterId: caster.id,
        });
      });

      caster.checkSupporterPassive(battleLog);
      return true;
    },
  },
};

