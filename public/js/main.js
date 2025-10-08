/**
 * Archivo Principal de la Aplicación Pathless
 * Inicializa todos los sistemas y coordina la aplicación
 */
class PathlessApp {
    constructor() {
        this.grid = null;
        this.astar = null;
        this.visualization = null;
        this.userInteraction = null;
        this.socket = null;
        
        this.init();
    }
    
    init() {
        console.log('Inicializando Pathless...');
        
        // Inicializar sistemas
        this.initializeGrid();
        this.initializeAStar();
        this.initializeVisualization();
        this.initializeUserInteraction();
        this.initializeSocket();
        
        // Crear grid inicial
        console.log('Creando grid inicial...');
        this.visualization.createGrid(this.grid);
        console.log('Grid creado exitosamente');
        
        console.log('Pathless inicializado correctamente');
    }
    
    initializeGrid() {
        this.grid = new Grid(30, 30);
        console.log('Grid inicializado: 30x30');
        
        // Canvas vacío - sin celdas de prueba
        console.log('Canvas inicializado vacío');
    }
    
    initializeAStar() {
        this.astar = new AStar(this.grid);
        console.log('Algoritmo A* inicializado');
    }
    
    initializeVisualization() {
        this.visualization = new Visualization3D('container');
        console.log('Visualización 3D inicializada');
    }
    
    initializeUserInteraction() {
        this.userInteraction = new UserInteraction(
            this.grid,
            this.visualization,
            this.astar
        );
        console.log('Interacción de usuario inicializada');
    }
    
    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Conectado al servidor');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
        });
        
        // Escuchar eventos del servidor
        this.socket.on('pathFound', (data) => {
            this.handlePathFound(data);
        });
        
        this.socket.on('error', (error) => {
            console.error('Error del servidor:', error);
            this.userInteraction.showMessage('Error: ' + error.message);
        });
    }
    
    handlePathFound(data) {
        if (data.path) {
            // Actualizar grid con el path encontrado
            this.grid.clearPath();
            
            // Marcar el path en el grid
            data.path.forEach((point, index) => {
                if (index > 0 && index < data.path.length - 1) {
                    this.grid.setCellType(point.x, point.y, 'path');
                }
            });
            
            // Actualizar visualización
            this.visualization.updateGrid(this.grid);
            
            // Animar carro
            this.visualization.animateCar(data.path, this.grid);
            
            // Mostrar estadísticas
            const stats = this.astar.getPathfindingStats(data.path);
            this.userInteraction.showMessage(
                `Camino encontrado! Longitud: ${stats.pathLength} celdas, Tiempo: ${data.timeTaken}ms`
            );
        } else {
            this.userInteraction.showMessage('No se pudo encontrar un camino.');
        }
    }
    
    // Método para enviar datos al servidor
    sendToServer(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }
    
    // Método para encontrar camino (puede usar servidor o cliente)
    findPath() {
        const stats = this.grid.getStats();
        
        if (!stats.hasStart || !stats.hasEnd) {
            this.userInteraction.showMessage('Por favor establece tanto el punto de inicio como el punto final.');
            return;
        }
        
        // Usar algoritmo local por ahora
        this.userInteraction.findPath();
    }
    
    // Método para limpiar todo
    clearAll() {
        this.grid.clearAll();
        this.visualization.updateGrid(this.grid);
        this.userInteraction.updateStatus();
    }
    
    // Método para resetear vista
    resetView() {
        this.visualization.resetCamera();
    }
    
    // Método para obtener estadísticas
    getStats() {
        return {
            grid: this.grid.getStats(),
            visualization: {
                isAnimating: this.visualization.isAnimating,
                carPosition: this.visualization.carPosition
            }
        };
    }
    
    // Método para cargar configuración
    loadConfiguration(config) {
        this.userInteraction.loadConfiguration(config);
    }
    
    // Método para exportar configuración
    exportConfiguration() {
        return this.userInteraction.exportConfiguration();
    }
    
    // Método para limpiar recursos
    dispose() {
        if (this.visualization) {
            this.visualization.dispose();
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');
    
    // Verificar que todos los elementos necesarios estén disponibles
    const container = document.getElementById('container');
    const canvas = document.getElementById('canvas');
    
    if (!container) {
        console.error('Contenedor no encontrado!');
        return;
    }
    
    if (!canvas) {
        console.error('Canvas no encontrado!');
        return;
    }
    
    console.log('Elementos DOM verificados correctamente');
    
    window.pathlessApp = new PathlessApp();
    
    // Exponer métodos globales para debugging
    window.findPath = () => window.pathlessApp.findPath();
    window.clearAll = () => window.pathlessApp.clearAll();
    window.resetView = () => window.pathlessApp.resetView();
    window.getStats = () => window.pathlessApp.getStats();
    
    console.log('Pathless está listo para usar!');
    console.log('Comandos disponibles: findPath(), clearAll(), resetView(), getStats()');
});

// Manejar cierre de ventana
window.addEventListener('beforeunload', () => {
    if (window.pathlessApp) {
        window.pathlessApp.dispose();
    }
});
