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
        if (this.shield > 0) {
            const absorbed = Math.min(finalDamage, this.shield);
            this.shield -= absorbed;
            finalDamage -= absorbed;
            logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수.`);
        }
        this.currentHp = Math.max(0, this.currentHp - finalDamage);
        this.totalDamageTakenThisBattle += finalDamage;
        if (this.currentHp <= 0) {
            this.isAlive = false;
            logFn(`☠️ ${this.name}이(가) 쓰러졌습니다.`);
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
