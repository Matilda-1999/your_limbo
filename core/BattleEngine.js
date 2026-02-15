/**
 * BattleEngine.js
 * 전투의 모든 계산과 상태 판정을 관리합니다.
 */

import { TYPE_RELATIONSHIPS, TYPE_ADVANTAGE_MODIFIER, TYPE_DISADVANTAGE_MODIFIER } from './Character.js';

export const BattleEngine = {
    /**
     * calculateDamage: 상성, 기믹(안전지대), 관통, 그로기가 반영된 최종 대미지 산출
     */
    calculateDamage(attacker, defender, skillPower, damageType, options = {}) {
        const { 
            statTypeToUse = null, 
            penetration = 0, 
            gimmickData = null, 
            parseSafeCoords = null,
            battleLog = null 
        } = options;

        // 1. 고정 피해(fixed) 처리: 방어력과 상성을 무시합니다.
        if (damageType === "fixed") {
            return Math.round(Math.max(0, skillPower));
        }

        // 2. 상성 판정
        let typeModifier = 1.0;
        
        // [수정] attacker 객체 존재 여부와 hasDebuff 메서드 확인 로직 강화
        // 공격자가 [우울 낙인] 상태가 아닐 때만 공격 상성 우위(1.3배)가 적용됩니다.
        const canApplyAdvantage = attacker && typeof attacker.hasDebuff === 'function' && !attacker.hasDebuff("melancholy_brand");

        if (canApplyAdvantage && TYPE_RELATIONSHIPS[attacker.type] === defender.type) {
            typeModifier = TYPE_ADVANTAGE_MODIFIER; // 1.3
        } else if (defender && TYPE_RELATIONSHIPS[defender.type] === attacker.type) {
            typeModifier = TYPE_DISADVANTAGE_MODIFIER; // 0.7
        }

        // 3. 기믹 판정 (대지의 수호 등 안전지대 메커니즘)
        let finalSkillPower = skillPower;
        
        // [수정] defender 객체와 activeGimmick 속성 접근 안전성 강화
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

        // 4. 공격자 상태 보정 ([쇠약] 적용)
        // [수정] attacker.debuffs 배열 존재 여부 확인
        if (attacker && Array.isArray(attacker.debuffs)) {
            const weakness = attacker.debuffs.find(d => d.id === "weakness");
            if (weakness && weakness.effect) {
                finalSkillPower *= (1 - (weakness.effect.damageMultiplierReduction || 0.2));
            }
        }

        // 5. 스탯 결정 및 [관통] 로직 적용
        let baseAttackStat = 0;
        let defenseStat = 0;

        if (damageType === "physical") {
            baseAttackStat = attacker.getEffectiveStat(statTypeToUse || "atk");
            defenseStat = defender.getEffectiveStat("def");
        } else if (damageType === "magical") {
            baseAttackStat = attacker.getEffectiveStat(statTypeToUse || "matk");
            defenseStat = defender.getEffectiveStat("mdef");
        }

        if (penetration > 0) {
            defenseStat *= (1 - penetration);
        }

        // 6. 기본 대미지 산출 공식
        let damage = (baseAttackStat * finalSkillPower * typeModifier) - defenseStat;
        damage = Math.max(0, damage);

        // 7. 방어자 상태 보정 ([침묵/그로기] 시 10% 추가 피해)
        if (defender && typeof defender.hasDebuff === 'function' && defender.hasDebuff("groggy")) {
            damage *= 1.1;
        }

        return Math.round(damage);
    },
    // ... 나머지 함수들 (applyHeal, checkBattleEnd)은 기존과 동일
};
