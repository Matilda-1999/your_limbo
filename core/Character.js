/**
 * Character.js
 * 모든 전투 메커니즘, 직군 특성, 디버프 중첩 관리 및 유틸리티 메서드를 통합한 클래스입니다.
 */

export const TYPE_RELATIONSHIPS = {
    "천체": "암석",
    "암석": "야수",
    "야수": "나무",
    "나무": "천체"
};

export const TYPE_ADVANTAGE_MODIFIER = 1.3;    // 상성 우위 시 데미지 배율
export const TYPE_DISADVANTAGE_MODIFIER = 0.7; // 상성 열위 시 데미지 배율

export class Character {
    constructor(name, type, job, currentHpOverride = null) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.name = name;
        this.type = type; // 영감 (천체, 암석, 야수, 나무)
        this.job = job;   // 직군 (딜러, 힐러, 서포터)

        // --- 1. 기본 스탯 및 영감/직군 보정 ---
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

        // --- 2. 전투 카운터 및 누적 데이터 ---
        this.totalDamageTakenThisBattle = 0;
        this.currentTurnDamageTaken = 0;
        this.aggroDamageStored = 0;
        this.lastSkillTurn = {};
    }

    /**
     * getEffectiveStat: 버프, 디버프, 낙인 효과가 반영된 최종 스탯 계산
     */
    getEffectiveStat(statName) {
        let value = this[statName];

        // 1. 낙인 효과 (환희/우울)
        const ecstasy = this.debuffs.find(d => d.id === "ecstasy_brand");
        const melancholy = this.debuffs.find(d => d.id === "melancholy_brand");

        if (ecstasy) {
            if (statName === "atk" || statName === "matk") value *= 1.1;
            if (statName === "def" || statName === "mdef") value *= 0.8;
        }
        if (melancholy) {
            if (statName === "atk" || statName === "matk") value *= 0.9;
        }

        // 2. 버프 처리
        this.buffs.forEach(buff => {
            if (buff.turnsLeft > 0 && buff.effect) {
                if (buff.effect.type === `${statName}_boost_multiplier`) value *= (buff.effect.value || 1);
                if (buff.effect.type === `${statName}_boost_flat`) value += (buff.effect.value || 0);
            }
        });

        // 3. 디버프 처리 (흠집, 방깎 등)
        this.debuffs.forEach(debuff => {
            if (debuff.turnsLeft > 0 && debuff.effect) {
                if (debuff.id === "scratch" && debuff.effect.reductionType === statName) {
                    value *= (1 - ((debuff.effect.reductionValue || 0.1) * (debuff.stacks || 1)));
                }
                if (debuff.id === "rupture_debuff") {
                    if (statName === "def") value *= (1 - (debuff.effect.defReduction || 0));
                    if (statName === "mdef") value *= (1 - (debuff.effect.mdefReduction || 0));
                }
            }
        });

        return isNaN(value) ? Math.max(0, this[statName]) : Math.max(0, value);
    }

    /**
     * takeDamage: 보호막, 피해 이전, 반사, 상태이상 해제 등을 포함한 데미지 처리
     */
    takeDamage(rawDamage, logFn, attacker = null, allies = [], enemies = [], state = {}) {
        if (!this.isAlive) return;

        // 1. [철옹성] 피해 이전
        if (allies.includes(this) && attacker) {
            const ironFortressAlly = allies.find(a => a.isAlive && a.id !== this.id && a.hasBuff("iron_fortress"));
            if (ironFortressAlly) {
                logFn(`✦피해 이전✦ ${this.name}의 피해 ${Math.round(rawDamage)}가 [철옹성] ${ironFortressAlly.name}에게 이전됩니다.`);
                ironFortressAlly.takeDamage(rawDamage, logFn, attacker, allies, enemies, state);
                return;
            }
        }

        let finalDamage = rawDamage;

        // 2. [악몽] 해제
        if (this.hasDebuff("nightmare")) {
            this.removeDebuffById("nightmare");
            logFn(`✦효과✦ ${this.name}, 공격을 받아 [악몽]에서 깨어납니다.`);
        }

        // 3. 보호막 흡수
        if (this.shield > 0) {
            const absorbed = Math.min(finalDamage, this.shield);
            this.shield -= absorbed;
            finalDamage -= absorbed;
            logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수. (남은 보호막: ${Math.round(this.shield)})`);
        }

        // 4. 체력 차감 및 데이터 갱신
        this.currentHp = Math.max(0, this.currentHp - finalDamage);
        this.totalDamageTakenThisBattle += finalDamage;
        this.currentTurnDamageTaken += finalDamage;

        // 5. [전이], [반사] 트리거
        if (attacker && finalDamage > 0) {
            if (this.hasDebuff("transfer")) {
                const heal = this.getEffectiveStat("atk");
                if (state.applyHeal) state.applyHeal(attacker, heal, logFn, "[전이] 효과");
            }
            const reflect = this.buffs.find(b => b.effect && b.effect.type === "damage_reflect");
            if (reflect) {
                const refDmg = finalDamage * reflect.effect.value;
                attacker.takeDamage(refDmg, logFn, this, enemies, allies, state);
            }
        }

        // 6. 사망 판정
        if (this.currentHp <= 0) {
            this.currentHp = 0;
            this.isAlive = false;
            logFn(`☠️ ${this.name}이(가) 쓰러졌습니다.`);
        }
    }

    // --- 유틸리티 메서드 (에러 방지용 필수 메서드 포함) ---

    addBuff(id, name, turns, effect, unremovable = false) {
        this.buffs = this.buffs.filter(b => b.id !== id);
        this.buffs.push({ id, name, turnsLeft: turns, effect, unremovable, stacks: effect.stacks || 1 });
        if (effect.shieldAmount) this.shield += effect.shieldAmount;
    }

    addDebuff(id, name, turns, effect) {
        if (this.buffs.some(b => b.id === "immunity")) {
            this.removeBuffById("immunity"); return;
        }
        const existing = this.debuffs.find(d => d.id === id);
        if (existing && effect.maxStacks) {
            existing.stacks = Math.min((existing.stacks || 1) + 1, effect.maxStacks);
            existing.turnsLeft = turns;
        } else {
            this.debuffs.push({ id, name, turnsLeft: turns, effect, stacks: 1 });
        }
    }

    // [필수] 디버프 중첩수 반환 (skills.js에서 호출)
    getDebuffStacks(debuffId) {
        const debuff = this.debuffs.find(d => d.id === debuffId);
        return debuff ? (debuff.stacks || 1) : 0;
    }

    hasBuff(id) { return this.buffs.some(b => b.id === id && b.turnsLeft > 0); }
    hasDebuff(id) { return this.debuffs.some(d => d.id === id && d.turnsLeft > 0); }
    removeBuffById(id) { this.buffs = this.buffs.filter(b => b.id !== id); }
    removeDebuffById(id) { this.debuffs = this.debuffs.filter(d => d.id !== id); }

    // 서포터 전용 패시브 체크 (에러 방지용 빈 메서드)
    checkSupporterPassive(logFn) {
        if (this.job === "서포터" && this.isAlive) {
            // 필요 시 서포터 특화 로직 추가 가능
        }
    }
}
