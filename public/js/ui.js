/**
 * Sistema de Interacción del Usuario
 * Maneja la interacción con el grid y la interfaz de usuario
 */
class UserInteraction {
    constructor(grid, visualization, astar) {
        this.grid = grid;
        this.visualization = visualization;
        this.astar = astar;
        
        this.currentMode = null; // Sin modo por defecto - usuario debe seleccionar
        this.isMouseDown = false;
        this.lastCell = null;
    this.autoRecompute = false; // cuando true, re-ejecutar ruta al colocar muros/tráfico
    this.currentTrafficLevel = 2; // valor por defecto del slider
        
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Eventos de modo de edición
        document.getElementById('mode-start').addEventListener('click', () => {
            this.setMode('start');
        });
        
        document.getElementById('mode-end').addEventListener('click', () => {
            this.setMode('end');
        });
        
        document.getElementById('mode-wall').addEventListener('click', () => {
            this.setMode('wall');
        });
        document.getElementById('mode-traffic').addEventListener('click', () => {
            this.setMode('traffic');
        });
        document.getElementById('mode-clear').addEventListener('click', () => {
            this.setMode('clear');
        });
        
        // Eventos de acción
        document.getElementById('find-path').addEventListener('click', () => {
            this.findPath();
        });
        
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAll();
        });
        
        // Eventos del canvas
        const canvas = document.getElementById('canvas');
        
        canvas.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
            this.handleCanvasClick(event);
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.lastCell = null;
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (this.isMouseDown) {
                this.handleCanvasClick(event);
            }
        });
        
        // Prevenir menú contextual
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Eventos de teclado
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });

        // Slider de tráfico
        const trafficSlider = document.getElementById('traffic-level');
        const trafficLabel = document.getElementById('traffic-level-label');
        if (trafficSlider) {
            trafficSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                this.currentTrafficLevel = v;
                if (trafficLabel) trafficLabel.textContent = String(v);
            });
        }
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.updateUI();
    }
    
    updateUI() {
        // Actualizar botones de modo
        const modeButtons = document.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        const activeButton = document.getElementById(`mode-${this.currentMode}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Actualizar estado
        this.updateStatus();
    }
    
    updateStatus() {
        const stats = this.grid.getStats();
        const viewModeElement = document.getElementById('view-mode');
        const toggleButton = document.getElementById('toggle-view');
        const startStatusElement = document.getElementById('start-status');
        const endStatusElement = document.getElementById('end-status');
        const wallsStatusElement = document.getElementById('walls-status');
        
        // Actualizar indicador de vista
        if (this.visualization && this.visualization.currentView === '2d') {
            if (viewModeElement) viewModeElement.textContent = '2D';
            if (toggleButton) toggleButton.textContent = 'Vista 3D';
        } else {
            if (viewModeElement) viewModeElement.textContent = '3D';
            if (toggleButton) toggleButton.textContent = 'Vista 2D';
        }
        
        // Actualizar estados individuales
        if (startStatusElement) startStatusElement.textContent = `Inicio: ${stats.hasStart ? '✓' : 'No'}`;
        if (endStatusElement) endStatusElement.textContent = `Final: ${stats.hasEnd ? '✓' : 'No'}`;
        if (wallsStatusElement) wallsStatusElement.textContent = `Muros: ${stats.walls} | Tráfico: ${stats.traffic}`;
    }
    
    getModeDescription() {
        const descriptions = {
            'start': 'Colocando punto de inicio',
            'end': 'Colocando punto final',
            'wall': 'Colocando muros',
            'traffic': 'Colocando tráfico',
            'clear': 'Limpiando celdas'
        };
        return descriptions[this.currentMode] || 'Selecciona un modo de edición';
    }
    
    handleCanvasClick(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convertir coordenadas del canvas a coordenadas del mundo
        const worldCoords = this.canvasToWorld(x, y);
        const gridCoords = this.visualization.worldToGrid(worldCoords.x, worldCoords.z, this.visualization.cellSize);
        
        if (!this.grid.isValidPosition(gridCoords.x, gridCoords.y)) {
            return;
        }
        
        // En vista 2D, permitir dibujo continuo más fluido
        const cellKey = `${gridCoords.x},${gridCoords.y}`;
        if (this.lastCell === cellKey && this.visualization.currentView === '2d') {
            // En vista 2D, permitir dibujo continuo sin restricciones
            return;
        } else if (this.lastCell === cellKey) {
            // En vista 3D, mantener comportamiento original
            return;
        }
        this.lastCell = cellKey;
        
        this.handleCellClick(gridCoords.x, gridCoords.y);
    }
    
    canvasToWorld(canvasX, canvasY) {
        // Convertir coordenadas del canvas a coordenadas normalizadas del dispositivo
        const x = (canvasX / window.innerWidth) * 2 - 1;
        const y = -(canvasY / window.innerHeight) * 2 + 1;
        
        // Crear rayo desde la cámara
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), this.visualization.camera);
        
        // Intersectar con el plano del suelo
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        
        return intersection;
    }
    
    handleCellClick(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell) return;
        
        // Si no hay modo seleccionado, no hacer nada
        if (!this.currentMode) {
            this.showMessage('Selecciona un modo primero: Inicio, Final, Muros o Limpiar');
            return;
        }
        
        switch (this.currentMode) {
            case 'start':
                this.placeStartPoint(x, y);
                break;
            case 'end':
                this.placeEndPoint(x, y);
                break;
            case 'wall':
                this.toggleWall(x, y);
                break;
            case 'traffic':
                this.toggleTraffic(x, y);
                break;
            case 'clear':
                this.clearCell(x, y);
                break;
        }
        
        this.updateStatus();
    }
    
    placeStartPoint(x, y) {
        // Limpiar punto de inicio anterior
        if (this.grid.startPoint) {
            this.grid.setCellType(this.grid.startPoint.x, this.grid.startPoint.y, 'empty');
        }
        
        // Establecer nuevo punto de inicio
        this.grid.setCellType(x, y, 'start');
        this.visualization.updateGrid(this.grid);
    }
    
    placeEndPoint(x, y) {
        // Limpiar punto final anterior
        if (this.grid.endPoint) {
            this.grid.setCellType(this.grid.endPoint.x, this.grid.endPoint.y, 'empty');
        }
        
        // Establecer nuevo punto final
        this.grid.setCellType(x, y, 'end');
        this.visualization.updateGrid(this.grid);
    }
    
    toggleWall(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell) return;
        
        // No permitir colocar muros en puntos de inicio o final
        if (cell.type === 'start' || cell.type === 'end') {
            return;
        }
        
        // Alternar entre muro y vacío
        const newType = cell.type === 'wall' ? 'empty' : 'wall';
        this.grid.setCellType(x, y, newType);
        this.visualization.updateGrid(this.grid);
        // Si estamos en modo auto recompute, recalcular la ruta desde la posición actual del agente
        if (this.autoRecompute) {
            this.recomputeFromAgent();
        }
    }
    toggleTraffic(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell) return;
        
        // No permitir colocar muros en puntos de inicio o final
        if (cell.type === 'start' || cell.type === 'end') {
            return;
        }
        
        // Alternar entre tráfico y vacío. Si se coloca tráfico, usar el nivel actual del slider
        if (cell.type === 'traffic') {
            this.grid.setCellType(x, y, 'empty');
        } else {
            this.grid.setTrafficLevel(x, y, this.currentTrafficLevel);
        }
        this.visualization.updateGrid(this.grid);
        if (this.autoRecompute) {
            this.recomputeFromAgent();
        }
    }
    
    clearCell(x, y) {
        const cell = this.grid.getCell(x, y);
        if (!cell) return;
        
        // Limpiar cualquier tipo de celda
        this.grid.setCellType(x, y, 'empty');
        this.visualization.updateGrid(this.grid);
    }
    
    findPath() {
        const stats = this.grid.getStats();
        
        if (!stats.hasStart || !stats.hasEnd) {
            alert('Por favor establece tanto el punto de inicio como el punto final.');
            return;
        }
        
    // Cambiar a vista 3D (45 grados) para pathfinding
    this.visualization.setCamera3D();

    // Limpiar path anterior (flags)
    this.grid.clearPath();
    this.visualization.updateGrid(this.grid);

    // Buscar camino
    const startTime = performance.now();
    const path = this.astar.findPathFromGrid();
    const endTime = performance.now();
        
        if (path) {
            // Mostrar estadísticas
            const pathStats = this.astar.getPathfindingStats(path);
            const timeTaken = (endTime - startTime).toFixed(2);
            
            console.log(`Camino encontrado en ${timeTaken}ms`);
            console.log(`Longitud del camino: ${pathStats.pathLength} celdas`);
            console.log(`Costo del camino: ${pathStats.pathCost.toFixed(2)}`);
            console.log(`Nodos explorados: ${pathStats.nodesExplored}`);
            
            // Actualizar visualización
            this.visualization.updateGrid(this.grid);
            
            // Animar el carro siguiendo el path
            this.visualization.animateCar(path, this.grid);

            // Activar auto recompute: si el usuario agrega muros/traffic se recalculará
            this.autoRecompute = true;

            // Mostrar mensaje de éxito
            this.showMessage(`¡Camino encontrado! Longitud: ${pathStats.pathLength} celdas, Tiempo: ${timeTaken}ms. Presiona 'R' para volver a vista 2D.`);
        } else {
            this.showMessage('No se pudo encontrar un camino. Verifica que no haya muros bloqueando el camino.');
        }
    }

    /**
     * Recalcula la ruta usando la posición actual del agente como inicio y el endPoint del grid como destino.
     * No cambia la cámara ni reinicia la visualización; actualiza path overlays y la ruta del carro.
     */
    recomputeFromAgent() {
        if (!this.visualization) return;
        if (!this.grid.endPoint) return;

        // Obtener la celda donde está actualmente el carro
        const carCell = this.visualization.getCarCurrentCell();
        let startCell = carCell;
        if (!startCell) {
            if (!this.grid.startPoint) return;
            startCell = this.grid.startPoint;
        }

        // Limpiar path previo
        this.grid.clearPath();

        // Buscar ruta desde la posición actual del agente
        const path = this.astar.findPath(startCell.x, startCell.y, this.grid.endPoint.x, this.grid.endPoint.y);
        if (path) {
            // Actualizar overlays
            this.visualization.updateGrid(this.grid);
            // Reemplazar la ruta del carro preservando posición aproximada
            this.visualization.setCarPathPreservePosition(path, this.grid);
        } else {
            // No se puede llegar: mostrar explosión y desactivar agente
            if (this.visualization && typeof this.visualization.explodeAtCarAndStop === 'function') {
                this.visualization.explodeAtCarAndStop();
            }
            this.autoRecompute = false;
            this.showMessage('Camino bloqueado: el agente no puede llegar a la meta.');
        }
    }
    
    clearAll() {
        this.grid.clearAll();
        this.visualization.updateGrid(this.grid);
        // Desactivar recompute automático y detener agente
        this.autoRecompute = false;
        if (this.visualization && typeof this.visualization.stopCarAnimation === 'function') {
            this.visualization.stopCarAnimation();
        }
        // Resetear vista a 2D tambien (comportamiento combinado)
        if (this.visualization && typeof this.visualization.setCamera2D === 'function') {
            this.visualization.setCamera2D();
        }
        this.updateStatus();
        this.showMessage('Grid y vista reseteados correctamente.');
    }
    
    resetView() {
        // Volver a vista 2D (90 grados) para dibujo
        this.visualization.setCamera2D();
        // Desactivar recompute automático y detener agente
        this.autoRecompute = false;
        if (this.visualization && typeof this.visualization.stopCarAnimation === 'function') {
            this.visualization.stopCarAnimation();
        }
        this.updateStatus();
        this.showMessage('Vista de cámara reseteada.');
    }
    
    toggleHelp() {
        const helpPanel = document.getElementById('help-panel');
        if (helpPanel.style.display === 'none') {
            helpPanel.style.display = 'block';
        } else {
            helpPanel.style.display = 'none';
        }
    }
    
    handleKeyPress(event) {
        switch (event.key.toLowerCase()) {
            case 's':
                this.setMode('start');
                break;
            case 'e':
                this.setMode('end');
                break;
            case 'w':
                this.setMode('wall');
                break;
            case 't':
                this.setMode('traffic');
                break;
            case 'c':
                this.setMode('clear');
                break;
            case 'f':
                this.findPath();
                break;
            case 'r':
                this.resetView();
                break;
            case 'h':
                this.toggleHelp();
                break;
            case 'escape':
                this.setMode('start');
                break;
        }
    }
    
    showMessage(message) {
        // Crear o actualizar elemento de mensaje
        let messageElement = document.getElementById('message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'message';
            messageElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 1000;
                font-size: 16px;
                text-align: center;
                pointer-events: none;
            `;
            document.body.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
    
    // Método para cargar configuración desde archivo
    loadConfiguration(config) {
        this.grid.clearAll();
        
        if (config.startPoint) {
            this.grid.setCellType(config.startPoint.x, config.startPoint.y, 'start');
        }
        
        if (config.endPoint) {
            this.grid.setCellType(config.endPoint.x, config.endPoint.y, 'end');
        }
        
        if (config.walls) {
            config.walls.forEach(wall => {
                this.grid.setCellType(wall.x, wall.y, 'wall');
            });
        }
        
        this.visualization.updateGrid(this.grid);
        this.updateStatus();
    }
    
    // Método para exportar configuración
    exportConfiguration() {
        const stats = this.grid.getStats();
        const config = {
            startPoint: stats.startPoint,
            endPoint: stats.endPoint,
            walls: []
        };
        
        // Recopilar todas las paredes
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell && cell.type === 'wall') {
                    config.walls.push({ x, y });
                }
            }
        }
        
        return config;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserInteraction;
}
