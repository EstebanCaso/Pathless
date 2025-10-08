/**
 * Implementación del algoritmo A* para pathfinding
 * Encuentra el camino más corto entre dos puntos en un grid
 */
class AStar {
    constructor(grid) {
        this.grid = grid;
    }
    
    /**
     * Encuentra el camino más corto usando A*
     */
    findPath(startX, startY, endX, endY) {
        if (!this.grid.isValidPosition(startX, startY) || !this.grid.isValidPosition(endX, endY)) {
            return null;
        }
        
        if (!this.grid.isWalkable(startX, startY) || !this.grid.isWalkable(endX, endY)) {
            return null;
        }
        
        // Limpiar pathfinding anterior
        this.grid.clearPath();
        
        const startCell = this.grid.getCell(startX, startY);
        const endCell = this.grid.getCell(endX, endY);
        
        const openSet = [];
        const closedSet = new Set();
        
        // Inicializar celda de inicio
        startCell.g = 0;
        startCell.h = this.heuristic(startCell, endCell);
        startCell.f = startCell.g + startCell.h;
        
        openSet.push(startCell);
        
        while (openSet.length > 0) {
            // Encontrar la celda con menor f en el openSet
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }
            
            const current = openSet[currentIndex];
            
            // Si llegamos al destino, reconstruir el camino
            if (current.x === endX && current.y === endY) {
                return this.reconstructPath(current);
            }
            
            // Mover current de openSet a closedSet
            openSet.splice(currentIndex, 1);
            closedSet.add(`${current.x},${current.y}`);
            
            // Examinar vecinos
            const neighbors = this.grid.getNeighbors(current.x, current.y, true);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
    
                 // Si el vecino está en closedSet, saltarlo
                if (closedSet.has(neighborKey)) {
                    continue;
                }
    
                // Calcular g tentativo
                const movementCost = this.distance(current, neighbor);
    
                // Penalización por tráfico (si la celda es tipo "traffic")
                let trafficPenalty = 0;
                if (neighbor.type === 'traffic') {
                    trafficPenalty = 2; // Ajusta este valor según la severidad del tráfico
                }

                const cellCost = neighbor.cost || 1;
                const tentativeG = current.g + movementCost * cellCost + trafficPenalty;
    
                // Si el vecino no está en openSet, agregarlo
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeG >= neighbor.g) {
                    // Si el camino actual no es mejor, saltarlo
                    continue;
                }
    
                // Este es el mejor camino hasta ahora
                neighbor.parent = current;
                neighbor.g = tentativeG;
                neighbor.h = this.heuristic(neighbor, endCell);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
        
        // No se encontró camino
        return null;
    }
    
    /**
     * Calcula la heurística (distancia estimada) entre dos celdas
     */
    heuristic(cellA, cellB) {
        // Usar distancia euclidiana para una heurística más precisa
        const dx = Math.abs(cellB.x - cellA.x);
        const dy = Math.abs(cellB.y - cellA.y);
        
        // Para diagonales, usar distancia euclidiana
        // Para movimientos ortogonales, usar distancia Manhattan
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calcula la distancia entre dos celdas adyacentes
     */
    distance(cellA, cellB) {
        const dx = Math.abs(cellB.x - cellA.x);
        const dy = Math.abs(cellB.y - cellA.y);
        
        // Si es movimiento diagonal, usar distancia euclidiana
        if (dx === 1 && dy === 1) {
            return Math.sqrt(2);
        }
        
        // Si es movimiento ortogonal, usar distancia Manhattan
        return dx + dy;
    }
    
    /**
     * Reconstruye el camino desde el destino hasta el inicio
     */
    reconstructPath(current) {
        const path = [];
        let cell = current;
        
        while (cell !== null) {
            path.unshift({ x: cell.x, y: cell.y });
            cell = cell.parent;
        }
        
        // Marcar el camino en el grid
        this.markPath(path);
        
        return path;
    }
    
    /**
     * Marca el camino encontrado en el grid
     */
    markPath(path) {
        // No marcar el punto de inicio y final como path
        for (let i = 1; i < path.length - 1; i++) {
            const point = path[i];
            const cell = this.grid.getCell(point.x, point.y);
            if (cell && cell.type === 'empty') {
                cell.type = 'path';
            }
        }
    }
    
    /**
     * Encuentra el camino usando los puntos de inicio y final del grid
     */
    findPathFromGrid() {
        if (!this.grid.startPoint || !this.grid.endPoint) {
            return null;
        }
        
        return this.findPath(
            this.grid.startPoint.x,
            this.grid.startPoint.y,
            this.grid.endPoint.x,
            this.grid.endPoint.y
        );
    }
    
    /**
     * Calcula estadísticas del pathfinding
     */
    getPathfindingStats(path) {
        if (!path || path.length === 0) {
            return {
                pathLength: 0,
                pathCost: 0,
                nodesExplored: 0,
                success: false
            };
        }
        
        let pathCost = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            pathCost += this.distance(
                { x: current.x, y: current.y },
                { x: next.x, y: next.y }
            );
        }
        
        return {
            pathLength: path.length,
            pathCost: pathCost,
            nodesExplored: this.countExploredNodes(),
            success: true
        };
    }
    
    /**
     * Cuenta los nodos explorados durante el pathfinding
     */
    countExploredNodes() {
        let count = 0;
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell && cell.g > 0) {
                    count++;
                }
            }
        }
        return count;
    }
    
    /**
     * Optimiza el camino eliminando puntos innecesarios
     */
    optimizePath(path) {
        if (!path || path.length <= 2) {
            return path;
        }
        
        const optimized = [path[0]]; // Siempre incluir el primer punto
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = optimized[optimized.length - 1];
            const current = path[i];
            const next = path[i + 1];
            
            // Si el ángulo cambia significativamente, mantener el punto
            const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
            const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
            
            if (Math.abs(angle1 - angle2) > 0.1) { // Tolerancia de ángulo
                optimized.push(current);
            }
        }
        
        optimized.push(path[path.length - 1]); // Siempre incluir el último punto
        
        return optimized;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AStar;
}
