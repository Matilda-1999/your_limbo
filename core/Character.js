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
    }

    getEffectiveStat(statName) {
    let value = this[statName];
    let additiveBonus = 0; // [실존] 등의 합연산 보너스

    // 1. 버프 처리 (곱연산 우선 후 합연산 합산)
    this.buffs.forEach(buff => {
        if (buff.turnsLeft > 0 && buff.effect) {
            // 곱연산 버프 (예: 방어력 20% 증가)
            if (buff.effect.type === `${statName}_boost_multiplier`) {
                value *= (buff.effect.value || 1);
            }
            // 합연산 버프 (예: [실존] 스택 보너스 고정치)
            if (buff.effect.type === `${statName}_boost_add`) {
                additiveBonus += (buff.effect.value || 0);
            }
        }
    });

    // 버프가 적용된 중간값 계산
    let totalStat = value + additiveBonus;

    // 2. 디버프 처리 (최종 수치에서 깎음)
    this.debuffs.forEach(debuff => {
        if (debuff.turnsLeft > 0 && debuff.effect) {
            // [흠집] 등 스택형 감소 디버프
            if (debuff.id === "scratch" && debuff.effect.reductionType === statName) {
                const reductionPerStack = debuff.effect.reductionValue || 0.1;
                const stacks = debuff.stacks || 1;
                // 예: 10%씩 5스택이면 총 50% 감소
                totalStat *= (1 - (reductionPerStack * stacks));
            }
            
            // 일반적인 고정 수치 감소 디버프가 있다면 추가 가능
            if (debuff.effect.type === `${statName}_reduce_multiplier`) {
                totalStat *= (debuff.effect.value || 1);
            }
        }
    });

    return Math.max(0, totalStat);
}

    takeDamage(rawDamage, logFn, attacker = null, allies = [], enemies = [], state = {}) {
        if (!this.isAlive) return;
        let finalDamage = rawDamage;

        // 내가 아닌 아군이 맞았을 때, 파티에 [철옹성] 버프를 가진 인원이 있는지 확인
        const protector = allies.find(a => 
            a.isAlive && (a.hasBuff("iron_fortress") || a.hasDebuff("provoked_self"))
        );
        
        if (protector && protector.id !== this.id) {
        logFn(`✦방어✦ ${protector.name}이(가) 공격을 가로채 대신 맞습니다!`);
            // protector가 대신 대미지를 입음
            protector.takeDamage(rawDamage, logFn, attacker, [this, ...allies.filter(a => a.id !== protector.id)], enemies, state);
            return; 
        }

        // 2. [도발 감쇄] 본인이 도발 상태라면 피해량 70% 감소 (30%만 받음)
        if (this.hasDebuff("provoked_self")) {
            finalDamage *= 0.3;
            logFn(`✦스킬✦ ${this.name}: 도발 효과로 피해량이 70% 감소합니다.`);
        }

        // 3. 보호막 처리
        if (this.shield > 0) {
            const absorbed = Math.min(finalDamage, this.shield);
            this.shield -= absorbed;
            finalDamage -= absorbed;
            logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수.`);
        }

        // 4. 체력 차감 및 피해 기록
        this.currentHp = Math.max(0, this.currentHp - finalDamage);
        this.totalDamageTakenThisBattle += finalDamage;

        // 도발 혹은 철옹성 상태일 때 받은 실질 피해 누적
        if (this.hasDebuff("provoked_self") || this.hasBuff("iron_fortress")) {
            this.provokeDamage = (this.provokeDamage || 0) + finalDamage;
        }

        // 3. [반격/역습] 통합 판정 로직
        // 턴 수 및 속성 정보 (공통)
        const isOddTurn = (state.currentTurn || 1) % 2 !== 0;

        // A. 역습
        const reversalBuff = this.buffs.find(b => b.id === "reversal_active");
        if (reversalBuff && attacker && finalDamage > 0) {
            const damageType = isOddTurn ? "physical" : "magical";
            const typeName = isOddTurn ? "물리" : "마법";
            const atkStat = this.getEffectiveStat("atk");
            const storedDmg = this.provokeDamage || 0;
            const counterDamage = Math.round((atkStat + storedDmg) * 1.5);
            
            logFn(`✦피해✦ ${this.name}, 반격. (저장된 피해: ${storedDmg})`);
            attacker.takeDamage(counterDamage, logFn, this, allies, enemies, state);
            
            this.buffs = this.buffs.filter(b => b.id !== "reversal_active");
            this.provokeDamage = 0; 
        }

        // B. 반격
        const counterProvider = [this, ...allies].find(member => 
            member.isAlive && member.buffs && member.buffs.some(b => b.id === "counter_active")
        );

        if (counterProvider && attacker && finalDamage > 0) {
            const isSelfHit = (counterProvider.id === this.id);
            const multiplier = isSelfHit ? 1.5 : 0.5; // 본인 피격 시 1.5배, 아군 피격 시 0.5배
            const counterDamage = Math.round(finalDamage * multiplier);

            if (isOddTurn) {
                // [홀수 턴: 응수] 체력이 가장 높은 적에게 단일 반격
                const targetEnemy = [...enemies].filter(e => e.isAlive).sort((a, b) => b.currentHp - a.currentHp)[0];
                if (targetEnemy) {
                    logFn(`✦응수✦ ${counterProvider.name}의 보복! ${this.name}을(를) 위해 ${targetEnemy.name}에게 ${counterDamage} 피해.`);
                    targetEnemy.takeDamage(counterDamage, logFn, counterProvider, enemies, allies, state);
                }
            } else {
                // [짝수 턴: 격노] 모든 적에게 광역 반격
                logFn(`✦격노✦ ${counterProvider.name}의 광역 반격! 모든 적에게 피해를 입힙니다.`);
                enemies.filter(e => e.isAlive).forEach(enemy => {
                    enemy.takeDamage(counterDamage, logFn, counterProvider, enemies, allies, state);
                });
            }
        }

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

    updateDebuffs(logFn, allies = [], enemies = [], state = {}) {
        this.debuffs.forEach(debuff => {
            debuff.turnsLeft--;

            // [진리] 중독 & 맹독 처리
            if (debuff.id === "poison_truth") {
                // 1. [중독] 결산: 현재 체력의 1.5% 피해
                const poisonDmg = Math.max(1, Math.round(this.currentHp * 0.015));
                logFn(`✦중독✦ ${this.name}이(가) 독으로 ${poisonDmg}의 피해를 입습니다.`);
                
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

// [추가] 공격 가능 여부를 판단하는 Getter
get canAttack() {
    // debuffs 배열에 'disarm' ID를 가진 디버프가 있는지 확인
    return !this.debuffs.some(d => d.id === "disarm");
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
