/**
 * Character.js
 * 모든 전투 메커니즘과 직군 특성, 디버프 중첩 관리 기능을 통합한 클래스입니다.
 */

export const TYPE_RELATIONSHIPS = {
    "천체": "암석",
    "암석": "야수",
    "야수": "나무",
    "나무": "천체"
};

export const TYPE_ADVANTAGE_MODIFIER = 1.3;
export const TYPE_DISADVANTAGE_MODIFIER = 0.7;

export class Character {
    constructor(name, type, job, currentHpOverride = null) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.name = name;
        this.type = type;
        this.job = job;

        this.atk = 15;
        this.matk = 15;
        this.def = 15;
        this.mdef = 15;
        this.maxHp = 100;

        switch (type) {
            case "천체": this.matk = 20; break;
            case "암석": this.def = 20; break;
            case "야수": this.atk = 20; break;
            case "나무": this.mdef = 20; break;
        }

        if (this.job === "딜러") {
            this.atk += 5; this.matk += 5; this.maxHp = 90;
        } else if (this.job === "힐러") {
            this.maxHp = 110;
        }

        this.currentHp = currentHpOverride !== null ? currentHpOverride : this.maxHp;
        this.isAlive = true;
        this.posX = -1;
        this.posY = -1;
        this.shield = 0;
        this.buffs = [];
        this.debuffs = [];

        this.totalDamageTakenThisBattle = 0;
        this.provokeDamage = 0;
        this.lastSkillTurn = {};
        this.actedThisTurn = false;             // 이번 턴에 행동(스킬/이동)을 완료했는가?
        this.usedAttackSkillThisTurn = false;   // 이번 턴에 사용한 스킬이 '공격'이었는가?
    }

   getEffectiveStat(statName) {
    let baseValue = this[statName]; // 기본값 (20)
    let additiveBonus = 0;          // 고정치 합계
    let multiplierTotal = 1.0;      // 배율 합계

    // 1. 버프 처리
    this.buffs.forEach(buff => {
        if (buff.turnsLeft > 0 && buff.effect) {
            // 고정치 보너스 (실재 버프 등)
            if (buff.effect.type === `${statName}_boost_add` || buff.id.includes(`${statName}_add`)) {
                additiveBonus += (buff.effect.value || 0);
            }
            // 배율 보너스
            if (buff.effect.type === `${statName}_boost_multiplier`) {
                multiplierTotal *= (buff.effect.value || 1);
            }
        }
    });

    this.debuffs.forEach(debuff => {
    if (debuff.turnsLeft > 0) {
        const stacks = debuff.stacks || 1;

        // 1. [흠집] 효과: 중첩당 방어/마방 10% 감소 (최대 3중첩)
        if (debuff.id === "scratched") {
                if (statName === "def" || statName === "mdef") {
                    // 1스택: 0.9, 2스택: 0.8, 3스택: 0.7 배율 적용
                    multiplierTotal *= (1 - (0.1 * stacks));
                }
            }

        // --- 환희 낙인: 방어 감소 + 공격 강화 ---
        if (debuff.id === "brand_joy") {
            // 1. 방어 성능 감소 (기존 로직: 중첩당 20%)
            if (statName === "def" || statName === "mdef") {
                multiplierTotal *= (1 - (0.2 * stacks));
            }
            // 2. 공격 성능 강화 (추가 로직: 중첩당 15% 강화)
            if (statName === "atk" || statName === "matk") {
                multiplierTotal *= (1 + (0.15 * stacks)); // 1중첩 시 1.15배, 3중첩 시 1.45배
            }
        }

        // 3. [우울 낙인]: 공격 성능 10% 감소
        if (debuff.id === "brand_melancholy" && (statName === "atk" || statName === "matk")) {
            multiplierTotal *= (1 - (0.1 * stacks));
        }

        // 4. 기타 일반 디버프 배율 처리
        if (debuff.effect && debuff.effect.type === `${statName}_reduce_multiplier`) {
            multiplierTotal *= (debuff.effect.value || 1);
                }
            }
        });
        
        // 최종 계산: (기본 + 고정치) * 통합 배율
        let finalStat = (baseValue + additiveBonus) * multiplierTotal;
        return Math.max(0, Math.round(finalStat));
        
            // 최종 스탯 반환 (여기서 메서드가 끝나야 합니다)
            return Math.max(0, totalStat);
        }

    takeDamage(rawDamage, logFn, attacker = null, allies = [], enemies = [], state = {}, isRedirected = false, isCounter = false) {
    if (!this.isAlive || rawDamage <= 0) return;
    
    let finalDamage = rawDamage;

    // 1. [가로채기] 로직 (이미 가로챈 피해거나 반격 피해는 재가로채기 불가)
    if (!isRedirected && !isCounter) {
        const protectors = allies.filter(a => 
            a.isAlive && (a.hasBuff("iron_fortress") || a.hasDebuff("provoked_self"))
        );

        if (protectors.length > 0) {
            const latestProtector = protectors.reduce((prev, current) => {
                return (prev.lastRedirectTime || 0) >= (current.lastRedirectTime || 0) ? current : prev;
            });

            if (latestProtector.id !== this.id) {
                logFn(`✦방어✦ ${latestProtector.name}, 동료를 대신해 공격을 맞습니다.`);
                // 인자 순서 주의: (damage, logFn, attacker, allies, enemies, state, isRedirected, isCounter)
                latestProtector.takeDamage(rawDamage, logFn, attacker, allies, enemies, state, true, false);
                return; 
            }
        }
    }

    /* 2. [악몽] 해제 판정 (피격 즉시 실행)
    if (this.hasDebuff("nightmare") && rawDamage > 0) {
        const nightmare = this.debuffs.find(d => d.id === "nightmare");
        if (nightmare) {
            nightmare.stacks = (nightmare.stacks || 1) - 1;
            if (nightmare.stacks <= 0) {
                this.removeDebuffById("nightmare");
                logFn(`✦해제✦ ${this.name}, 충격으로 인해 [악몽]에서 깨어납니다.`);
            }
        }
    } */

    // 3. [반격/역습] 판정 (isCounter가 아닐 때만 발동하여 무한 루프 방지)
    if (!isCounter && attacker && rawDamage > 0) {
        const isOddTurn = (state.currentTurn || 1) % 2 !== 0;

        // A. 반격
        const counterProvider = [this, ...allies].find(member => 
            member.isAlive && member.buffs && member.buffs.some(b => b.id === "counter_active")
        );

        if (counterProvider) {
            const isSelfHit = (counterProvider.id === this.id);
            const multiplier = isSelfHit ? 1.5 : 0.5;
            const counterDamage = Math.round(rawDamage * multiplier);

            // 반격 반동 (보호막 소모)
            if (counterProvider.shield > 0) {
                const shieldCost = Math.round(counterProvider.shield * 0.1);
                counterProvider.shield = Math.max(0, counterProvider.shield - shieldCost);
                logFn(`✦반격 반동✦ ${counterProvider.name}, 보호막이 ${shieldCost} 감소합니다.`);
            }

            if (isOddTurn) {
                // 인자 순서 교정: (damage, logFn, caster, casterAllies, casterEnemies, state, isRedirected, isCounter)
                const targetEnemy = enemies.filter(e => e.isAlive).sort((a, b) => b.currentHp - a.currentHp)[0];
                if (targetEnemy) {
                    logFn(`✦스킬✦ ${counterProvider.name}, 응수. ${targetEnemy.name}에게 ${counterDamage} 반격.`);
                    targetEnemy.takeDamage(counterDamage, logFn, counterProvider, enemies, allies, state, false, true);
                }
            } else {
                logFn(`✦스킬✦ ${counterProvider.name}, 격노. 모든 적에게 ${counterDamage} 반격.`);
                enemies.filter(e => e.isAlive).forEach(enemy => {
                    enemy.takeDamage(counterDamage, logFn, counterProvider, enemies, allies, state, false, true);
                });
            }
        }

        // B. 역습
        const reversalBuff = this.buffs.find(b => b.id === "reversal_active");
        if (reversalBuff) {
            const atkStat = this.getEffectiveStat("atk");
            const storedDmg = this.provokeDamage || 0;
            const counterDamage = Math.round((atkStat + storedDmg) * 1.5);
            
            logFn(`✦피해✦ ${this.name}, 역습. (저장된 피해: ${storedDmg})`);
            attacker.takeDamage(counterDamage, logFn, this, allies, enemies, state, false, true);
            
            this.removeBuffById("reversal_active");
            this.provokeDamage = 0; 
        }
    }

    // 4. 대미지 보정 (도발 감쇄 등)
    if (this.hasDebuff("provoked_self")) {
        finalDamage = Math.round(finalDamage * 0.3);
        logFn(`✦스킬✦ ${this.name}: 도발 효과로 피해량이 70% 감소합니다.`);
    }

    // 5. 보호막 처리
    if (this.shield > 0 && finalDamage > 0) {
        const absorbed = Math.min(finalDamage, this.shield);
        this.shield -= absorbed;
        finalDamage -= absorbed;
        logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수.`);
    }

    // 6. 최종 체력 차감
    this.currentHp = Math.max(0, this.currentHp - finalDamage);
    this.totalDamageTakenThisBattle += finalDamage;

    // 도발/철옹성 스탯 누적
    if (this.hasDebuff("provoked_self") || this.hasBuff("iron_fortress")) {
        this.provokeDamage = (this.provokeDamage || 0) + finalDamage;
    }

    // 7. 사망 판정
    if (this.currentHp <= 0) {
        this.isAlive = false;
        logFn(`✦☠️✦ ${this.name}, 쓰러집니다.`);
    }   
}

    addBuff(id, name, turns, effect) {
        // 1. 기존에 같은 ID를 가진 버프가 있다면 먼저 제거 (중복 방지)
        this.buffs = this.buffs.filter(b => b.id !== id);
    
        // 2. 새로운 버프 추가
        this.buffs.push({ id, name, turnsLeft: turns, effect });
    
        // 3. 버프 부여 시 보호막 합산
        if (effect && effect.shieldAmount) {
            this.shield += effect.shieldAmount;
        }
    }

    updateBuffs(logFn, allies = [], enemies = [], state = {}) {
        this.buffs.forEach(buff => {
            buff.turnsLeft--;
    
            // 1. [허상] 턴 종료 시 추가 공격 실행
            if (buff.effect && buff.effect.extraAttack && buff.turnsLeft === 0) {
                // 저장된 타겟 ID로 살아 있는 적을 찾음
                const target = enemies.find(e => e.id === buff.effect.targetId && e.isAlive);
                if (target) {
                    const dmg = Math.round(this.getEffectiveStat("atk") * (buff.effect.powerMultiplier || 0.5));
                    logFn(`✦허상:추격✦ ${this.name}의 잔영이 가장 강한 적 ${target.name}에게 ${dmg}의 피해를 입힙니다!`);
                    target.takeDamage(dmg, logFn, this, enemies, allies, state);
                }
            }

        // 2. [의지] 버프 종료 시 기믹
        if (buff.turnsLeft === 0) {
            // 보호막을 체력으로 흡수
            if (buff.effect && buff.effect.healOnRemove) {
                const healAmount = Math.round(this.shield);
                this.currentHp = Math.min(this.maxHp, this.currentHp + healAmount);
                logFn(`✦의지✦ ${this.name}가 보호막을 체력으로 흡수합니다. (+${healAmount})`);
                this.shield = 0; 
            }
            // 받은 피해 기록 초기화
            if (buff.effect && buff.effect.resetsTotalDamageTaken) {
                this.totalDamageTakenThisBattle = 0;
            }
        }
    });
    this.buffs = this.buffs.filter(b => b.turnsLeft > 0);
}

    updateDebuffs(logFn, state = {}) { 
    this.debuffs.forEach(debuff => {
        if (debuff.id === "poison_truth") {
            // 1. 기초 데이터 준비
            const allies = state.allyCharacters || [];
            const enemies = state.enemyCharacters || [];
            
            // 2. 본인 중독 피해 처리
            const poisonDmg = Math.max(1, Math.round(this.currentHp * 0.015));
            logFn(`✦중독✦ ${this.name}, ${poisonDmg}의 피해를 입습니다.`);
            
            this.takeDamage(poisonDmg, logFn, null, allies, enemies, state);

            // 3. 맹독 전파 로직
            const allCharacters = [...allies, ...enemies];
            const caster = allCharacters.find(a => a.id === debuff.effect.casterId);

            if (caster && caster.isAlive) {
                // 시전자의 팀을 판별하여 타겟 팀 결정
                const isCasterAlly = allies.some(a => a.id === caster.id);
                const targets = isCasterAlly ? enemies : allies;
                
                const aliveTargets = targets.filter(t => t.isAlive);
                if (aliveTargets.length > 0) {
                    const venomDmg = Math.round(poisonDmg * 0.3);
                    logFn(`✦맹독✦ ${this.name}의 독기가 모든 적에게 퍼집니다. (추가 피해: ${venomDmg})`);
                    
                    aliveTargets.forEach(target => {
                        target.takeDamage(venomDmg, logFn, caster, targets, isCasterAlly ? allies : enemies, state);
                    });
                }
            }
        }
    });
}
    
    addDebuff(id, name, turns, effect = {}) {
    // 1. 기존에 같은 ID의 디버프가 있는지 확인
    const existingIdx = this.debuffs.findIndex(d => d.id === id);

    if (existingIdx > -1) {
        // 중첩(Stack) 설정이 있는 경우
        if (effect.maxStacks) {
            this.debuffs[existingIdx].stacks = Math.min(
                (this.debuffs[existingIdx].stacks || 1) + 1, 
                effect.maxStacks
            );
        }
        // 턴 수 갱신 (더 긴 쪽으로 유지하거나 새로고침)
        this.debuffs[existingIdx].turnsLeft = Math.max(this.debuffs[existingIdx].turnsLeft, turns);
    } else {
        // 2. 새로운 디버프 추가
        this.debuffs.push({ 
            id, 
            name, 
            turnsLeft: turns, 
            effect, 
            stacks: 1 
        });
    }
}

// 공격 가능 여부를 판단하는 Getter
get canAttack() {
    // debuffs 배열에 'disarm' ID를 가진 디버프가 있는지 확인
    return !this.hasDebuff("disarm") && !this.hasDebuff("nightmare");
}

    getDebuffStacks(debuffId) {
        const debuff = this.debuffs.find(d => d.id === debuffId);
        return debuff ? (debuff.stacks || 1) : 0;
    }

    hasBuff(id) { return this.buffs.some(b => b.id === id && b.turnsLeft > 0); }
    hasDebuff(id) { return this.debuffs.some(d => d.id === id && d.turnsLeft > 0); }
    removeBuffById(id) { this.buffs = this.buffs.filter(b => b.id !== id); }
    removeDebuffById(id) { this.debuffs = this.debuffs.filter(d => d.id !== id); }
    checkSupporterPassive() {} 
}
