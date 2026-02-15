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

        // 2. 상성 판정 (공격자가 [우울 낙인] 상태면 상성 우위 효과 무효)
        let typeModifier = 1.0;
        if (!attacker.hasDebuff("melancholy_brand") && TYPE_RELATIONSHIPS[attacker.type] === defender.type) {
            typeModifier = TYPE_ADVANTAGE_MODIFIER; // 1.3
        } else if (TYPE_RELATIONSHIPS[defender.type] === attacker.type) {
            typeModifier = TYPE_DISADVANTAGE_MODIFIER; // 0.7
        }

        // 3. 기믹 판정 (대지의 수호 등 안전지대 메커니즘)
        let finalSkillPower = skillPower;
        
        if (defender.activeGimmick && defender.activeGimmick.startsWith("GIMMICK_Aegis_of_Earth")) {
            // 현재 활성화된 기믹의 상세 데이터(좌표 등)를 가져옴
            const currentGimmick = gimmickData ? gimmickData[defender.activeGimmick] : null;
            
            if (currentGimmick && currentGimmick.coords && parseSafeCoords) {
                const safeZone = parseSafeCoords(currentGimmick.coords);
                // 공격자가 안전지대 좌표 안에 있는지 확인
                const isAttackerInSafeZone = safeZone.some(pos => pos.x === attacker.posX && pos.y === attacker.posY);

                if (isAttackerInSafeZone) {
                    if (battleLog) battleLog(`✦기믹 효과✦ ${attacker.name}, 안전지대 내부 공격으로 피해량이 1.5배 증가합니다.`);
                    finalSkillPower *= 1.5;
                } else {
                    if (battleLog) battleLog(`✦기믹 효과✦ ${attacker.name}, 안전지대 외부 공격으로 피해가 무시됩니다.`);
                    return 0; // 데미지 완전 무효화
                }
            }
        }

        // 4. 공격자 상태 보정 ([쇠약] 적용)
        const weakness = attacker.debuffs.find(d => d.id === "weakness");
        if (weakness) {
            finalSkillPower *= (1 - (weakness.effect.damageMultiplierReduction || 0.2));
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

        // 관통(Penetration) 적용: 방어력의 일정 비율을 무시
        if (penetration > 0) {
            defenseStat *= (1 - penetration);
        }

        // 6. 기본 대미지 산출 공식
        let damage = (baseAttackStat * finalSkillPower * typeModifier) - defenseStat;
        damage = Math.max(0, damage);

        // 7. 방어자 상태 보정 ([침묵/그로기] 시 10% 추가 피해)
        if (defender.hasDebuff("groggy")) {
            damage *= 1.1;
        }

        return Math.round(damage);
    },

    /**
     * applyHeal: 캐릭터의 직군 패시브를 고려한 체력 회복 처리
     */
    applyHeal(target, baseHealAmount, battleLog, sourceName = "회복") {
        let finalHeal = baseHealAmount;
        
        // 탱커 패시브: 체력 20% 이하일 때 치유량 5% 증가
        if (target.job === "탱커" && target.isAlive && target.currentHp <= target.maxHp * 0.2) {
            finalHeal = Math.round(baseHealAmount * 1.05);
            if (battleLog) battleLog(`✦직군 효과(탱커)✦ [불굴의 맹세] 발동. 받는 치유량이 5% 증가합니다.`);
        }

        target.currentHp = Math.min(target.maxHp, target.currentHp + finalHeal);
        if (battleLog) {
            battleLog(`✦회복✦ ${target.name}, [${sourceName}] 효과: 체력 ${Math.round(finalHeal)} 회복. (HP: ${Math.round(target.currentHp)})`);
        }
    },

    /**
     * checkBattleEnd: 승리/패배 조건 확인
     */
    checkBattleEnd(allies, enemies) {
        const allEnemiesDead = enemies.length > 0 && enemies.every(char => !char.isAlive);
        const allAlliesDead = allies.length > 0 && allies.every(char => !char.isAlive);

        if (allEnemiesDead) return "WIN";
        if (allAlliesDead) return "LOSE";
        return null;
    }
};