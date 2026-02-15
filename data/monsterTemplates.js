/**
 * monsterTemplates.js
 * 몬스터의 기본 능력치 및 보유 스킬/기믹 리스트를 정의합니다.
 */

export const MONSTER_TEMPLATES = {
  // 1. 고정 타입을 갖는 보스 몬스터 (테르모르)
  Terrmor_1: {
    name: "테르모르",
    type: "암석",
    maxHp: 1500,
    atk: 50,
    matk: 50,
    def: 35,
    mdef: 20,
    skills: [
      "SKILL_Seismic_Fissure",
      "SKILL_Echo_of_Silence",
      "SKILL_Crushing_Sky",
    ],
    gimmicks: [
      "GIMMICK_Aegis_of_Earth1",
      "GIMMICK_Aegis_of_Earth2",
      "GIMMICK_Aegis_of_Earth3",
      "GIMMICK_Aegis_of_Earth4",
    ],
  },

  Terrmor_2: {
    name: "테르모르",
    type: "나무",
    maxHp: 2000,
    atk: 50,
    matk: 50,
    def: 20,
    mdef: 35,
    skills: [
      "SKILL_Birth_of_Vines",
      "SKILL_Spores_of_Silence",
      "SKILL_Seeds_Wrath",
    ],
    gimmicks: ["GIMMICK_Path_of_Ruin", "GIMMICK_Seed_of_Devour"],
  },

  // 2. 고정 타입을 갖는 보스 몬스터 (카르나블룸)
  Carnabloom_1: {
    name: "카르나블룸",
    type: "야수",
    maxHp: 1500,
    atk: 50,
    matk: 50,
    def: 35,
    mdef: 20,
    skills: ["SKILL_Thread_of_Emotion"],
    gimmicks: ["GIMMICK_Curtain_Call", "GIMMICK_Encore", "GIMMICK_Duet"],
  },

  Carnabloom_2: {
    name: "카르나블룸",
    type: "천체",
    maxHp: 2500,
    atk: 50,
    matk: 50,
    def: 20,
    mdef: 35,
    skills: ["SKILL_Play1", "SKILL_Crimson", "SKILL_Silence"],
    gimmicks: [
      "GIMMICK_Script_Reversal",
      "GIMMICK_The_Final_Curtain1",
      "GIMMICK_The_Final_Curtain2",
      "GIMMICK_Dress_Rehearsal1",
      "GIMMICK_Dress_Rehearsal2",
      "GIMMICK_Dress_Rehearsal3",
      "GIMMICK_Dress_Rehearsal4",
    ],
  },

  // 3. 랜덤 타입을 갖는 일반/엘리트 몬스터
  Pierrot: {
    name: "피에로",
    type: ["암석", "나무"], // 맵 배치 시 랜덤 결정
    maxHp: 300,
    atk: 30,
    matk: 30,
    def: 20,
    mdef: 20,
    skills: [
      "SKILL_Slapstick_Comdey_P",
      "SKILL_Get_a_Present_P",
      "GIMMICK_Tears_of",
    ],
    gimmicks: [],
  },

  Clown: {
    name: "클라운",
    type: ["암석", "나무"],
    maxHp: 300,
    atk: 30,
    matk: 30,
    def: 20,
    mdef: 20,
    skills: [
      "SKILL_Slapstick_Comdey_C",
      "SKILL_Get_a_Present_C",
      "GIMMICK_Laugh_of",
    ],
    gimmicks: [],
  },
};
