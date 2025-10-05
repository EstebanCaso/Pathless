/**
 * Configuraciones de ejemplo para Pathless
 * Incluye diferentes escenarios de pathfinding
 */
const EXAMPLE_CONFIGS = {
    // Configuración simple - camino directo
    simple: {
        name: "Camino Simple",
        description: "Un camino directo sin obstáculos",
        startPoint: { x: 3, y: 3 },
        endPoint: { x: 27, y: 27 },
        walls: []
    },
    
    // Configuración con muros - camino en L
    lShape: {
        name: "Camino en L",
        description: "Un camino que requiere hacer una curva en L",
        startPoint: { x: 3, y: 3 },
        endPoint: { x: 27, y: 27 },
        walls: [
            // Muro vertical en el medio
            { x: 15, y: 6 }, { x: 15, y: 7 }, { x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 10 },
            { x: 15, y: 11 }, { x: 15, y: 12 }, { x: 15, y: 13 }, { x: 15, y: 14 }, { x: 15, y: 15 },
            { x: 15, y: 16 }, { x: 15, y: 17 }, { x: 15, y: 18 }, { x: 15, y: 19 }, { x: 15, y: 20 },
            { x: 15, y: 21 }, { x: 15, y: 22 }, { x: 15, y: 23 }, { x: 15, y: 24 }, { x: 15, y: 25 }
        ]
    },
    
    // Configuración compleja - laberinto
    maze: {
        name: "Laberinto",
        description: "Un laberinto complejo que requiere navegación cuidadosa",
        startPoint: { x: 2, y: 2 },
        endPoint: { x: 28, y: 28 },
        walls: [
            // Muros horizontales
            { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
            { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 },
            { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 }, { x: 19, y: 6 }, { x: 20, y: 6 },
            { x: 21, y: 6 }, { x: 22, y: 6 }, { x: 23, y: 6 }, { x: 24, y: 6 }, { x: 25, y: 6 },
            
            // Muros verticales
            { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 }, { x: 10, y: 14 },
            { x: 10, y: 15 }, { x: 10, y: 16 }, { x: 10, y: 17 }, { x: 10, y: 18 }, { x: 10, y: 19 },
            { x: 10, y: 20 }, { x: 10, y: 21 }, { x: 10, y: 22 }, { x: 10, y: 23 }, { x: 10, y: 24 },
            { x: 10, y: 25 }, { x: 10, y: 26 }, { x: 10, y: 27 }, { x: 10, y: 28 }, { x: 10, y: 29 },
            
            // Más muros para crear un laberinto
            { x: 20, y: 12 }, { x: 21, y: 12 }, { x: 22, y: 12 }, { x: 23, y: 12 }, { x: 24, y: 12 },
            { x: 25, y: 12 }, { x: 26, y: 12 }, { x: 27, y: 12 }, { x: 28, y: 12 }, { x: 29, y: 12 },
            
            { x: 18, y: 18 }, { x: 18, y: 19 }, { x: 18, y: 20 }, { x: 18, y: 21 }, { x: 18, y: 22 },
            { x: 18, y: 23 }, { x: 18, y: 24 }, { x: 18, y: 25 }, { x: 18, y: 26 }, { x: 18, y: 27 },
            { x: 18, y: 28 }, { x: 18, y: 29 }
        ]
    },
    
    // Configuración de prueba - camino imposible
    impossible: {
        name: "Camino Imposible",
        description: "Un escenario donde no existe camino posible",
        startPoint: { x: 3, y: 3 },
        endPoint: { x: 27, y: 27 },
        walls: [
            // Muro que bloquea completamente el camino
            { x: 15, y: 3 }, { x: 15, y: 4 }, { x: 15, y: 5 }, { x: 15, y: 6 }, { x: 15, y: 7 },
            { x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 10 }, { x: 15, y: 11 }, { x: 15, y: 12 },
            { x: 15, y: 13 }, { x: 15, y: 14 }, { x: 15, y: 15 }, { x: 15, y: 16 }, { x: 15, y: 17 },
            { x: 15, y: 18 }, { x: 15, y: 19 }, { x: 15, y: 20 }, { x: 15, y: 21 }, { x: 15, y: 22 },
            { x: 15, y: 23 }, { x: 15, y: 24 }, { x: 15, y: 25 }, { x: 15, y: 26 }, { x: 15, y: 27 }
        ]
    }
};

// Exportar configuraciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXAMPLE_CONFIGS;
}
