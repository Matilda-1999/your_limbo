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
    let value = this[statName];
    let additiveBonus = 0; 

    // 1. 버프 처리
    this.buffs.forEach(buff => {
        if (buff.turnsLeft > 0 && buff.effect) {
            if (buff.effect.type === `${statName}_boost_multiplier`) {
                value *= (buff.effect.value || 1);
            }
            if (buff.effect.type === `${statName}_boost_add`) {
                additiveBonus += (buff.effect.value || 0);
            }
            if (buff.id === `reality_${statName}_add`) {
                additiveBonus += (buff.effect.value || 0);
            }
        }
    });

    let totalStat = value + additiveBonus;

    // 2. 디버프 및 낙인(Brand) 처리
    this.debuffs.forEach(debuff => {
        if (debuff.turnsLeft > 0) {
            const stacks = debuff.stacks || 1;

            // 우울: 공/마공 10% 감소 (중첩당)
            if (debuff.id === "brand_melancholy" && (statName === "atk" || statName === "matk")) {
                totalStat *= (1 - (0.1 * stacks));
            }
            // 환희: 방/마방 20% 감소, 공/마공 10% 증폭 (중첩당)
            if (debuff.id === "brand_joy") {
                if (statName === "def" || statName === "mdef") totalStat *= (1 - (0.2 * stacks));
                else if (statName === "atk" || statName === "matk") totalStat *= (1 + (0.1 * stacks));
            }

            // [기존 흠집 디버프]: 스택당 방어 성능 감소
            if (debuff.id === "scratch" && debuff.effect && debuff.effect.reductionType === statName) {
                const reductionPerStack = debuff.effect.reductionValue || 0.1;
                totalStat *= (1 - (reductionPerStack * stacks));
            }

            // [기타 일반 디버프 배율]
            if (debuff.effect && debuff.effect.type === `${statName}_reduce_multiplier`) {
                totalStat *= (debuff.effect.value || 1);
            }
        }
    });

    // 최종 스탯 반환 (여기서 메서드가 끝나야 합니다)
    return Math.max(0, totalStat);
}

    takeDamage(rawDamage, logFn, attacker = null, allies = [], enemies = [], state = {}, isRedirected = false) {
        if (!this.isAlive) return;
        let finalDamage = rawDamage;

        // 1. [가로채기] 로직: 이미 가로챈 대미지(isRedirected=true)가 아닐 때만 실행
    if (!isRedirected) {
        // 철옹성이나 도발 상태인 아군들을 찾습니다.
        const protectors = allies.filter(a => 
            a.isAlive && (a.hasBuff("iron_fortress") || a.hasDebuff("provoked_self"))
        );

        if (protectors.length > 0) {
            // lastRedirectTime이 가장 큰(가장 나중에 행동을 결정한) 보호자를 찾습니다.
            const latestProtector = protectors.reduce((prev, current) => {
                return (prev.lastRedirectTime || 0) >= (current.lastRedirectTime || 0) ? current : prev;
            });

            // 내가 가장 최신 보호자가 아니라면, 최신 보호자에게 대미지를 넘깁니다.
            if (latestProtector.id !== this.id) {
                logFn(`✦방어✦ ${latestProtector.name}, 주문 순서에 따라 공격을 대신 맞습니다.`);
                // 마지막 인자에 true를 보내서, 넘겨받은 보호자가 다시 가로채기를 발동하지 않게 합니다.
                latestProtector.takeDamage(rawDamage, logFn, attacker, allies, enemies, state, true);
                return; 
            }
        }
    }

        // 2. [반격/역습] 판정 (보호막 적용 전 rawDamage 기준으로 실행)
    const isOddTurn = (state.currentTurn || 1) % 2 !== 0;

    // A. 반격 (모든 아군 피격 시 체크)
    const counterProvider = [this, ...allies].find(member => 
        member.isAlive && member.buffs && member.buffs.some(b => b.id === "counter_active")
    );

    // rawDamage > 0 조건으로 변경하여 보호막 흡수 시에도 반격이 나가도록 함
    if (counterProvider && attacker && rawDamage > 0) {
        const isSelfHit = (counterProvider.id === this.id);
        const multiplier = isSelfHit ? 1.5 : 0.5;
        const counterDamage = Math.round(rawDamage * multiplier);

        // [신규 기믹] 반격 발동 시 시전자의 보호막 10% 소모 (반격의 반동)
        if (counterProvider.shield > 0) {
            const shieldCost = Math.round(counterProvider.shield * 0.1);
            counterProvider.shield = Math.max(0, counterProvider.shield - shieldCost);
            logFn(`✦반격 반동✦ ${counterProvider.name}, 반격의 여파로 보호막이 ${shieldCost}만큼 감소합니다.`);
        }

        if (isOddTurn) {
            const targetEnemy = [...enemies].filter(e => e.isAlive).sort((a, b) => b.currentHp - a.currentHp)[0];
            if (targetEnemy) {
                logFn(`✦스킬✦ ${counterProvider.name}의 응수. ${this.name}을(를) 위해 ${targetEnemy.name}에게 ${counterDamage} 피해.`);
                targetEnemy.takeDamage(counterDamage, logFn, counterProvider, enemies, allies, state);
            }
        } else {
            logFn(`✦스킬✦ ${counterProvider.name}의 격노. 모든 적에게 피해를 입힙니다.`);
            enemies.filter(e => e.isAlive).forEach(enemy => {
                enemy.takeDamage(counterDamage, logFn, counterProvider, enemies, allies, state);
            });
        }
    }

        // B. 역습 (본인 전용)
        const reversalBuff = this.buffs.find(b => b.id === "reversal_active");
        if (reversalBuff && attacker && rawDamage > 0) {
            const atkStat = this.getEffectiveStat("atk");
            const storedDmg = this.provokeDamage || 0;
            const counterDamage = Math.round((atkStat + storedDmg) * 1.5);
            
            logFn(`✦피해✦ ${this.name}, 역습 실행. (저장된 피해: ${storedDmg})`);
            attacker.takeDamage(counterDamage, logFn, this, allies, enemies, state);
            
            this.buffs = this.buffs.filter(b => b.id !== "reversal_active");
            this.provokeDamage = 0; 
        }
    
        // 3. 도발 대미지 감쇄 (기존 유지)
        if (this.hasDebuff("provoked_self")) {
            finalDamage *= 0.3;
            logFn(`✦스킬✦ ${this.name}: 도발 효과로 피해량이 70% 감소합니다.`);
        }
    
        // 4. 보호막 처리
        if (this.shield > 0) {
            const absorbed = Math.min(finalDamage, this.shield);
            this.shield -= absorbed;
            finalDamage -= absorbed;
            logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수.`);
        }
    
        // 5. 체력 차감 및 피해 기록
        this.currentHp = Math.max(0, this.currentHp - finalDamage);
        this.totalDamageTakenThisBattle += finalDamage;
    
        if (this.hasDebuff("provoked_self") || this.hasBuff("iron_fortress")) {
            this.provokeDamage = (this.provokeDamage || 0) + finalDamage;
        }

        // 피해량이 0보다 크고 악몽 상태일 때만 해제
        if (this.hasDebuff("nightmare") && finalDamage > 0) {
    const nightmare = this.debuffs.find(d => d.id === "nightmare");
    if (nightmare) {
        nightmare.stacks = (nightmare.stacks || 1) - 1; // 스택 차감
        
        if (nightmare.stacks <= 0) {
            this.removeDebuffById("nightmare");
            logFn(`✦해제✦ ${this.name}, 충격으로 인해 [악몽]에서 깨어납니다.`);
        }
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

    updateDebuffs(logFn, allies = [], enemies = [], state = {}) {
        this.debuffs.forEach(debuff => {
            debuff.turnsLeft--;

            // [진리] 중독 & 맹독 처리
            if (debuff.id === "poison_truth") {
                // 1. [중독] 결산: 현재 체력의 1.5% 피해
                const poisonDmg = Math.max(1, Math.round(this.currentHp * 0.015));
                logFn(`✦중독✦ ${this.name}, 독으로 ${poisonDmg}의 피해를 입습니다.`);
                
                // 데미지 입힘 (공격자 null 처리)
                this.takeDamage(poisonDmg, logFn, null, enemies, allies, state);

                // 2. [맹독] 결산 후 추가 공격 (시전자의 공격력 x 30%)
                const caster = allies.find(a => a.id === debuff.effect.casterId);
                if (caster && caster.isAlive) {
                    const aliveEnemies = enemies.filter(e => e.isAlive);
                    if (aliveEnemies.length > 0) {
                        const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                        const venomDmg = Math.round(caster.getEffectiveStat("atk") * 0.3);
                        
                        logFn(`✦맹독✦ 결산 완료. ${caster.name}의 맹독이 ${randomTarget.name}을(를) 추가 타격합니다!`);
                        randomTarget.takeDamage(venomDmg, logFn, caster, enemies, allies, state);
                    }
                }
            }
        });

        // 턴이 다 된 디버프 제거
        this.debuffs = this.debuffs.filter(d => d.turnsLeft > 0);
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
