# Pathless - 3D Pathfinding Simulator

Un simulador 3D de pathfinding que utiliza el algoritmo A* para encontrar el camino más corto en un grid de 100x100.

## Características

- Grid interactivo de 100x100 cuadros
- Algoritmo A* para encontrar el camino óptimo
- Visualización 3D con Three.js
- Animación de un carro siguiendo el path encontrado
- Interfaz para colocar puntos de entrada, salida y muros

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

Luego abre tu navegador en `http://localhost:3000`

## Estructura del Proyecto

- `server.js` - Servidor Express
- `public/` - Archivos estáticos (HTML, CSS, JS)
- `src/` - Código fuente del simulador
  - `grid/` - Sistema de grid y pathfinding
  - `visualization/` - Renderizado 3D
  - `ui/` - Interfaz de usuario
