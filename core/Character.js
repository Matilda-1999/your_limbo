/**
 * Character.js
 * 원본 script.js의 모든 전투 메커니즘과 직군 특성을 통합한 클래스입니다.
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
        this.type = type; // 영감
        this.job = job;   // 직군

        // --- 1. 기본 스탯 및 영감/직군 보정 (원문 준수) ---
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

        // --- 2. 전투 카운터 및 누적 데이터 (원문 유지) ---
        this.totalDamageTakenThisBattle = 0;
        this.currentTurnDamageTaken = 0;
        this.aggroDamageStored = 0;
        this.lastSkillTurn = {};
        this.dealerExtraDamageCount = 0;
        this.healerBoostCount = 0;
        this.supporterShieldCount = 0;
    }

    /**
     * getEffectiveStat: [낙인], [버프], [디버프], [직군 효과]가 모두 반영된 최종 스탯 계산
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

        // 2. 버프 처리 (배수/고정치/실존 보너스)
        this.buffs.forEach(buff => {
            if (buff.turnsLeft > 0 && buff.effect) {
                if (buff.effect.type === `${statName}_boost_multiplier`) value *= (buff.effect.value || 1);
                if (buff.effect.type === `${statName}_boost_flat`) value += (buff.effect.value || 0);
                if (buff.effect.type === 'reality_boost' && (statName === 'def' || statName === 'mdef')) value += (buff.effect.value || 0);
            }
        });

        // 3. 디버프 처리 (흠집/서포터 패시브/붕괴/쇠약)
        this.debuffs.forEach(debuff => {
            if (debuff.turnsLeft > 0 && debuff.effect) {
                if (debuff.id === "scratch" && debuff.effect.reductionType === statName) {
                    value *= (1 - ((debuff.effect.reductionValue || 0.1) * (debuff.stacks || 1)));
                }
                if (debuff.id === "supporter_def_shred" && statName === "def") value *= (debuff.effect.value || 0.95);
                if (debuff.id === "rupture_debuff") {
                    if (statName === "def") value *= (1 - (debuff.effect.defReduction || 0));
                    if (statName === "mdef") value *= (1 - (debuff.effect.mdefReduction || 0));
                }
                if (debuff.id === "weakness" && (statName === "atk" || statName === "matk")) {
                    value *= (1 - (debuff.effect.damageMultiplierReduction || 0.2));
                }
            }
        });

        return isNaN(value) ? Math.max(0, this[statName]) : Math.max(0, value);
    }

    /**
     * takeDamage: [철옹성], [도발 감쇄], [보호막], [서포터 보호막 파괴], [피해 반사], [전이], [흔적], [커튼콜] 통합
     */
    takeDamage(rawDamage, logFn, attacker = null, allies = [], enemies = [], state = {}) {
        if (!this.isAlive) return;

        // 1. [철옹성] 피해 이전 체크 (아군일 경우)
        if (allies.includes(this) && attacker) {
            const ironFortressAlly = allies.find(a => a.isAlive && a.id !== this.id && a.hasBuff("iron_fortress"));
            if (ironFortressAlly) {
                logFn(`✦피해 이전✦ ${this.name}의 피해 ${Math.round(rawDamage)}가 [철옹성] ${ironFortressAlly.name}에게 이전됩니다.`);
                ironFortressAlly.takeDamage(rawDamage, logFn, attacker, allies, enemies, state);
                return;
            }
        }

        let finalDamage = rawDamage;

        // 2. 도발/방어 버프 감쇄
        const provokeBuff = this.buffs.find(b => b.id === "provoke_damage_reduction");
        if (provokeBuff && provokeBuff.effect.damageReduction) {
            finalDamage *= (1 - provokeBuff.effect.damageReduction);
        }

        // 3. [악몽] 해제
        if (this.hasDebuff("nightmare")) {
            this.removeDebuffById("nightmare");
            logFn(`✦효과✦ ${this.name}, 공격을 받아 [악몽]에서 깨어납니다.`);
        }

        // 4. 보호막 흡수 및 서포터 효과
        const shieldBefore = this.shield;
        if (this.shield > 0) {
            const absorbed = Math.min(finalDamage, this.shield);
            this.shield -= absorbed;
            finalDamage -= absorbed;
            logFn(`✦보호막✦ ${this.name}: 피해 ${Math.round(absorbed)} 흡수. (남은 보호막: ${Math.round(this.shield)})`);
        }

        if (this.job === "서포터" && shieldBefore > 0 && this.shield <= 0) {
            logFn(`✦직군 효과✦ ${this.name}의 보호막이 파괴되어 주변 적의 방어력이 감소합니다!`);
            // 주변 적 디버프 로직은 엔진에서 처리하거나 helper 호출
        }

        // 5. 실제 체력 차감 및 누적 데이터 갱신
        this.currentHp = Math.max(0, this.currentHp - finalDamage);
        this.totalDamageTakenThisBattle += finalDamage;
        this.currentTurnDamageTaken += finalDamage;
        if (this.hasBuff("iron_fortress") || this.hasBuff("provoke_active")) this.aggroDamageStored += finalDamage;

        // 6. [전이], [반사], [흔적] 트리거 (attacker가 존재할 때)
        if (attacker && finalDamage > 0) {
            // [전이] 회복
            if (this.hasDebuff("transfer")) {
                const heal = this.getEffectiveStat("atk");
                if (state.applyHeal) state.applyHeal(attacker, heal, logFn, "[전이] 효과");
            }
            // [반사] 피해
            const reflect = this.buffs.find(b => b.effect.type === "damage_reflect");
            if (reflect) {
                const refDmg = finalDamage * reflect.effect.value;
                attacker.takeDamage(refDmg, logFn, this, enemies, allies, state);
            }
        }

        // 7. [흔적] 대리 회복 체크
        if (this.currentHp <= this.maxHp * 0.5 && this.hasBuff("trace")) {
            const trace = this.buffs.find(b => b.id === "trace");
            const caster = [...allies, ...enemies].find(c => c.id === trace.effect.originalCasterId);
            if (caster && caster.isAlive && state.applyHeal) {
                caster.currentHp -= (caster.maxHp * 0.05);
                state.applyHeal(this, this.maxHp * 0.25, logFn, "[흔적] 효과");
            }
        }

        // 8. 사망 판정 및 [커튼콜] 부활
        if (this.currentHp <= 0) {
            if (this.name === "카르나블룸" && this.type === "야수" && state.checkCurtainCall) {
                if (state.checkCurtainCall(this)) return; // 부활 성공 시 종료
            }
            this.currentHp = 0;
            this.isAlive = false;
            logFn(`☠️ ${this.name}이(가) 쓰러졌습니다.`);
        }
    }

    // --- 유틸리티 메서드 (원문과 동일) ---
    addBuff(id, name, turns, effect, unremovable = false) {
        this.buffs = this.buffs.filter(b => b.id !== id);
        this.buffs.push({ id, name, turnsLeft: turns, effect, unremovable, stacks: effect.stacks || 1 });
        if (effect.shieldAmount) this.shield += effect.shieldAmount;
    }

    addDebuff(id, name, turns, effect) {
        if (this.buffs.some(b => b.id === "immunity")) {
            this.removeBuffById("immunity"); return;
        }
        this.debuffs.push({ id, name, turnsLeft: turns, effect, stacks: effect.maxStacks ? 1 : 1 });
    }

    hasBuff(id) { return this.buffs.some(b => b.id === id && b.turnsLeft > 0); }
    hasDebuff(id) { return this.debuffs.some(d => d.id === id && d.turnsLeft > 0); }
    removeBuffById(id) { this.buffs = this.buffs.filter(b => b.id !== id); }
    removeDebuffById(id) { this.debuffs = this.debuffs.filter(d => d.id !== id); }
}
