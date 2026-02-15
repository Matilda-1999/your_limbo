/**
 * Utils.js
 * 좌표 파싱, 캐릭터 검색, 거리 계산 등 공통 유틸리티 함수를 관리합니다.
 */

export const Utils = {
    /**
     * "x1,y1;x2,y2" 형태의 문자열을 좌표 객체 배열 [{x, y}]로 변환합니다.
     */
    parseSafeCoords(coordsStr) {
        if (!coordsStr || typeof coordsStr !== 'string') return [];
        return coordsStr.split(";")
            .map(s => s.trim())
            .filter(s => s !== "" && s.includes(","))
            .map(s => {
                const [x, y] = s.split(",").map(n => parseInt(n.trim()));
                return (!isNaN(x) && !isNaN(y)) ? { x, y } : null;
            })
            .filter(pos => pos !== null);
    },

    /**
     * ID를 사용하여 모든 캐릭터(아군, 적군, 오브젝트) 목록에서 대상을 찾습니다.
     */
    findCharacterById(id, allies = [], enemies = [], objects = []) {
        return [...allies, ...enemies, ...objects].find(char => char.id === id);
    },

    /**
     * 특정 캐릭터 주변(8방향)의 적을 찾아 배열로 반환합니다.
     * 서포터의 보호막 파괴 패시브 등에서 활용됩니다.
     */
    findAdjacentEnemies(character, enemies = [], characterPositions = {}) {
        const adjacentEnemies = [];
        const offsets = [
            { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
            { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 },
        ];

        offsets.forEach(offset => {
            const adjX = character.posX + offset.dx;
            const adjY = character.posY + offset.dy;
            const targetId = characterPositions[`${adjX},${adjY}`];
            
            if (targetId) {
                const target = enemies.find(e => e.id === targetId && e.isAlive);
                if (target) adjacentEnemies.push(target);
            }
        });
        return adjacentEnemies;
    },

    /**
     * 맵에서 비어 있는 무작위 셀 좌표를 반환합니다.
     * 몬스터 추가 소환 기믹에서 활용됩니다.
     */
    getRandomEmptyCell(width, height, occupiedPositions = {}) {
        const emptyCells = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!occupiedPositions[`${x},${y}`]) {
                    emptyCells.push({ x, y });
                }
            }
        }
        if (emptyCells.length === 0) return null;
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
};