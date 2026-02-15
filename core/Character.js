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
        this.lastSkillTurn = {};
    }

    getEffectiveStat(statName) {
        let value = this[statName];
        this.buffs.forEach(buff => {
            if (buff.turnsLeft > 0 && buff.effect && buff.effect.type === `${statName}_boost_multiplier`) {
                value *= (buff.effect.value || 1);
            }
        });
        this.debuffs.forEach(debuff => {
            if (debuff.turnsLeft > 0 && debuff.id === "scratch" && debuff.effect.reductionType === statName) {
                value *= (1 - ((debuff.effect.reductionValue || 0.1) * (debuff.stacks || 1)));
            }
        });
        return Math.max(0, value);
    }

    takeDamage(rawDamage, logFn, attacker = null, allies = [], enemies = [], state = {}) {
        if (!this.isAlive) return;
        let finalDamage = rawDamage;

        // 보호막 처리
        if (this.shield > 0) {
            const absorbed = Math.min(finalDamage, this.shield);
            this.shield -= absorbed;
            finalDamage -= absorbed;
            logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수.`);
        }

        // 2. 체력 차감 및 피해 기록
        this.currentHp = Math.max(0, this.currentHp - finalDamage);
        this.totalDamageTakenThisBattle += finalDamage;

        // 도발 중이라면 받은 피해를 저장
        if (this.hasDebuff && this.hasDebuff("provoked_self")) {
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
        this.buffs = this.buffs.filter(b => b.id !== id);
        this.buffs.push({ id, name, turnsLeft: turns, effect });
        if (effect.shieldAmount) this.shield += effect.shieldAmount;
    }

    addDebuff(id, name, turns, effect) {
        const existing = this.debuffs.find(d => d.id === id);
        if (existing && effect.maxStacks) {
            existing.stacks = Math.min((existing.stacks || 1) + 1, effect.maxStacks);
            existing.turnsLeft = turns;
        } else {
            this.debuffs.push({ id, name, turnsLeft: turns, effect, stacks: 1 });
        }
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
