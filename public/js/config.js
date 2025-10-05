/**
 * Configuración y constantes de la aplicación
 */
const CONFIG = {
    // Configuración del grid
    GRID: {
        WIDTH: 30,
        HEIGHT: 30,
        CELL_SIZE: 1
    },
    
    // Configuración de la visualización
    VISUALIZATION: {
        // Vista 2D (para selección)
        CAMERA_2D: {
            FOV: 75,
            NEAR: 0.1,
            FAR: 1000,
            POSITION: { x: 15, y: 30, z: 0 },
            TARGET: { x: 15, y: 0, z: 15 }
        },
        // Vista 3D (para animación)
        CAMERA_3D: {
            FOV: 75,
            NEAR: 0.1,
            FAR: 1000,
            POSITION: { x: 15, y: 20, z: 15 },
            TARGET: { x: 15, y: 0, z: 15 }
        },
        LIGHTS: {
            AMBIENT: { color: 0x404040, intensity: 0.4 },
            DIRECTIONAL: { color: 0xffffff, intensity: 0.8 },
            POINT: { color: 0x4CAF50, intensity: 0.5, distance: 100 }
        },
        MATERIALS: {
            EMPTY: 0x2a2a2a,
            WALL: 0x8B4513,
            START: 0x4CAF50,
            END: 0xF44336,
            PATH: 0x2196F3,
            CAR: 0xFFD700
        }
    },
    
    // Configuración de la animación
    ANIMATION: {
        CAR_SPEED: 0.02,
        CAR_HEIGHT: 0.3,
        GRID_HEIGHT: 0.1,
        TRANSITION_DURATION: 2000 // Duración de transición de vista en ms
    },
    
    // Configuración de vistas
    VIEWS: {
        MODE_2D: '2d',
        MODE_3D: '3d',
        CURRENT: '2d' // Vista inicial
    },
    
    // Configuración de la interfaz
    UI: {
        MESSAGE_DURATION: 3000,
        ZOOM_SPEED: 0.1,
        ROTATION_SPEED: 0.01
    },
    
    // Configuración del servidor
    SERVER: {
        PORT: 3000,
        HOST: 'localhost'
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
