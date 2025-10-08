/**
 * Sistema de Grid para Pathfinding
 * Maneja un grid de 100x100 con diferentes tipos de celdas
 */
class Grid {
    constructor(width = 100, height = 100) {
        this.width = width;
        this.height = height;
        this.cells = [];
        this.startPoint = null;
        this.endPoint = null;
        
        // Inicializar grid vacío
        this.initializeGrid();
    }
    
    initializeGrid() {
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x] = {
                    type: 'empty', // 'empty', 'wall', 'start', 'end', 'path'
                    x: x,
                    y: y,
                    walkable: true,
                    cost:1,
                    g: 0, // Costo desde el inicio
                    h: 0, // Heurística hasta el final
                    f: 0, // f = g + h
                    parent: null
                };
            }
        }
    }
    
    /**
     * Establece el tipo de celda en una posición específica
     */
    setCellType(x, y, type) {
        if (this.isValidPosition(x, y)) {
            const cell = this.cells[y][x];
            
            // Limpiar referencias previas
            if (cell.type === 'start') {
                this.startPoint = null;
            } else if (cell.type === 'end') {
                this.endPoint = null;
            }
            
            // Establecer nuevo tipo
            cell.type = type;
            
            if(type == 'wall'){
                cell.walkable = false;
                cell.cost = Infinity;
            }else if(type === 'traffic'){
                cell.walkable = true;
                cell.cost = 2;
            }else{
                cell.walkable = true;
                cell.cost = 1;
            }
            
            // Actualizar referencias
            if (type === 'start') {
                this.startPoint = { x, y };
            } else if (type === 'end') {
                this.endPoint = { x, y };
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Obtiene el tipo de celda en una posición específica
     */
    getCellType(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.cells[y][x].type;
        }
        return null;
    }
    
    /**
     * Obtiene la celda en una posición específica
     */
    getCell(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.cells[y][x];
        }
        return null;
    }
    
    /**
     * Verifica si una posición es válida dentro del grid
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * Verifica si una celda es caminable
     */
    isWalkable(x, y) {
        const cell = this.getCell(x, y);
        return cell ? cell.walkable : false;
    }
    
    /**
     * Obtiene las celdas vecinas de una posición
     */
    getNeighbors(x, y, allowDiagonal = true) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Arriba
            { x: 1, y: 0 },  // Derecha
            { x: 0, y: 1 },  // Abajo
            { x: -1, y: 0 }  // Izquierda
        ];
        
        if (allowDiagonal) {
            directions.push(
                { x: 1, y: -1 },  // Diagonal superior derecha
                { x: 1, y: 1 },   // Diagonal inferior derecha
                { x: -1, y: 1 },  // Diagonal inferior izquierda
                { x: -1, y: -1 }  // Diagonal superior izquierda
            );
        }
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (this.isValidPosition(newX, newY) && this.isWalkable(newX, newY)) {
                // Para movimientos diagonales, verificar que no haya muros en las esquinas
                if (this.isDiagonalMove(dir.x, dir.y)) {
                    if (this.hasDiagonalCornerBlocked(x, y, dir.x, dir.y)) {
                        console.log(`Movimiento diagonal bloqueado desde (${x}, ${y}) hacia (${newX}, ${newY})`);
                        continue; // Saltar este movimiento diagonal
                    }
                }
                
                neighbors.push(this.getCell(newX, newY));
            }
        }
        
        return neighbors;
    }
    
    /**
     * Verifica si un movimiento es diagonal
     */
    isDiagonalMove(dx, dy) {
        return dx !== 0 && dy !== 0;
    }
    
    /**
     * Verifica si hay muros bloqueando un movimiento diagonal
     */
    hasDiagonalCornerBlocked(x, y, dx, dy) {
        // Para un movimiento diagonal, verificar las dos celdas ortogonales adyacentes
        const corner1X = x + dx;
        const corner1Y = y;
        const corner2X = x;
        const corner2Y = y + dy;
        
        // Si cualquiera de las dos esquinas tiene un muro, bloquear el movimiento diagonal
        const corner1Blocked = this.isValidPosition(corner1X, corner1Y) && !this.isWalkable(corner1X, corner1Y);
        const corner2Blocked = this.isValidPosition(corner2X, corner2Y) && !this.isWalkable(corner2X, corner2Y);
        
        return corner1Blocked || corner2Blocked;
    }
    
    /**
     * Calcula la distancia entre dos puntos
     */
    calculateDistance(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Limpia el grid completamente
     */
    clearAll() {
        this.initializeGrid();
        this.startPoint = null;
        this.endPoint = null;
    }
    
    /**
     * Limpia solo los muros
     */
    clearWalls() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (cell.type === 'wall' || cell.type === 'traffic') {
                    cell.type = 'empty';
                    cell.walkable = true;
                }
            }
        }
    }
    
    /**
     * Limpia el path encontrado
     */
    clearPath() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (cell.type === 'path') {
                    cell.type = 'empty';
                }
                // Resetear valores de pathfinding
                cell.g = 0;
                cell.h = 0;
                cell.f = 0;
                cell.parent = null;
            }
        }
    }
    
    /**
     * Obtiene estadísticas del grid
     */
    getStats() {
        let walls = 0;
        let traffic = 0;
        let pathCells = 0;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (cell.type === 'wall') walls++;
                if (cell.type === 'traffic') traffic++;
                if (cell.type === 'path') pathCells++;
            }
        }
        
        return {
            totalCells: this.width * this.height,
            walls: walls,
            traffic: traffic,
            pathCells: pathCells,
            startPoint: this.startPoint,
            endPoint: this.endPoint,
            hasStart: this.startPoint !== null,
            hasEnd: this.endPoint !== null
        };
    }
    
    /**
     * Convierte coordenadas del mundo a coordenadas del grid
     */
    worldToGrid(worldX, worldY, cellSize = 1) {
        const gridX = Math.floor(worldX / cellSize);
        const gridY = Math.floor(worldY / cellSize);
        return { x: gridX, y: gridY };
    }
    
    /**
     * Convierte coordenadas del grid a coordenadas del mundo
     */
    gridToWorld(gridX, gridY, cellSize = 1) {
        const worldX = gridX * cellSize + cellSize / 2;
        const worldY = gridY * cellSize + cellSize / 2;
        return { x: worldX, y: worldY };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Grid;
}
