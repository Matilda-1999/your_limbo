/**
 * BattleEngine.js
 * 전투의 모든 계산과 상태 판정을 관리합니다.
 */

import { TYPE_RELATIONSHIPS, TYPE_ADVANTAGE_MODIFIER, TYPE_DISADVANTAGE_MODIFIER } from './Character.js';

export const BattleEngine = {
    // calculateDamage: 상성, 기믹(안전지대), 관통, 그로기가 반영된 최종 대미지 산출
    calculateDamage(attacker, defender, skillPower, damageType, options = {}) {
        const { 
            statTypeToUse = null, 
            penetration = 0, 
            gimmickData = null, 
            parseSafeCoords = null,
            battleLog = null 
        } = options;

        // 1. 공격자 기본 공격 스탯 결정 (물리/마법 구분)
        // 고정 피해라도 '공격자의 스탯'에 비례해야 하므로 먼저 산출
        let baseAttackStat = 0;
        if (damageType === "magical" || statTypeToUse === "matk") {
            baseAttackStat = attacker.getEffectiveStat("matk");
        } else {
            baseAttackStat = attacker.getEffectiveStat("atk");
        }

        // 2. 고정 피해(fixed) 처리
        if (damageType === "fixed") {
            // 방어력을 무시하고 (공격력 * 계수)를 반환 (최소 1 보장)
            const fixedDmg = Math.max(1, baseAttackStat * skillPower);
            return Math.round(fixedDmg);
        }

        // 3. 상성 판정 (일반 물리/마법 공격에만 적용)
        let typeModifier = 1.0;
        const canApplyAdvantage = attacker && typeof attacker.hasDebuff === 'function' && !attacker.hasDebuff("melancholy_brand");

        if (canApplyAdvantage && TYPE_RELATIONSHIPS[attacker.type] === defender.type) {
            typeModifier = TYPE_ADVANTAGE_MODIFIER; // 1.3
        } else if (defender && TYPE_RELATIONSHIPS[defender.type] === attacker.type) {
            typeModifier = TYPE_DISADVANTAGE_MODIFIER; // 0.7
        }

        // 4. 기믹 판정 (안전지대 메커니즘)
        let finalSkillPower = skillPower;
        if (defender && defender.activeGimmick && defender.activeGimmick.startsWith("GIMMICK_Aegis_of_Earth")) {
            const currentGimmick = gimmickData ? gimmickData[defender.activeGimmick] : null;
            
            if (currentGimmick && currentGimmick.coords && parseSafeCoords) {
                const safeZone = parseSafeCoords(currentGimmick.coords);
                const isAttackerInSafeZone = safeZone.some(pos => pos.x === attacker.posX && pos.y === attacker.posY);

                if (isAttackerInSafeZone) {
                    if (battleLog) battleLog(`✦기믹 효과✦ ${attacker.name}, 안전지대 내부 공격으로 피해량이 1.5배 증가합니다.`);
                    finalSkillPower *= 1.5;
                } else {
                    if (battleLog) battleLog(`✦기믹 효과✦ ${attacker.name}, 안전지대 외부 공격으로 피해가 무시됩니다.`);
                    return 0; 
                }
            }
        }

        // 5. 공격자 상태 보정 ([쇠약] 적용)
        if (attacker && Array.isArray(attacker.debuffs)) {
            const weakness = attacker.debuffs.find(d => d.id === "weakness");
            if (weakness && weakness.effect) {
                finalSkillPower *= (1 - (weakness.effect.damageMultiplierReduction || 0.2));
            }
        }

        // 6. 방어력 결정 및 관통 적용
        let defenseStat = 0;
        if (damageType === "physical") {
            defenseStat = defender.getEffectiveStat("def");
        } else if (damageType === "magical") {
            defenseStat = defender.getEffectiveStat("mdef");
        }

        if (penetration > 0) {
            defenseStat *= (1 - penetration);
        }

        // 7. 기본 대미지 산출 공식 (방어력 차감)
        let damage = (baseAttackStat * finalSkillPower * typeModifier) - defenseStat;
        damage = Math.max(0, damage);

        // 8. 방어자 상태 보정 ([쇠약] 대상 추가 피해)
        if (defender && Array.isArray(defender.debuffs)) {
            const weaknessDebuff = defender.debuffs.find(d => d.id === "weakness");
            if (weaknessDebuff) {
                const fixedBonus = Math.round(attacker.getEffectiveStat("atk") * 0.3);
                damage += fixedBonus;
                if (battleLog) battleLog(`✦쇠약 효과✦ ${defender.name}의 약점을 찔러 ${fixedBonus}의 추가 피해를 입혔습니다.`);
            }
        }

        return Math.round(damage);
    },

    applyHeal(target, amount, logFn, skillName = "회복") {
        if (!target || !target.isAlive) return;
        const oldHp = target.currentHp;
        target.currentHp = Math.min(target.maxHp, target.currentHp + amount);
        const actualHeal = target.currentHp - oldHp;
        logFn(`✦회복✦ ${target.name}, [${skillName}]으로 체력 +${Math.round(actualHeal)} 회복. (현재 HP: ${Math.round(target.currentHp)})`);
    },

    checkBattleEnd(allyCharacters, enemyCharacters) {
        const allAlliesDead = allyCharacters.every(c => !c.isAlive);
        const allEnemiesDead = enemyCharacters.every(c => !c.isAlive);

        if (allAlliesDead) return "LOSE";
        if (allEnemiesDead) return "WIN";
        return null; 
    }
};
