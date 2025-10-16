/**
 * Sistema de Visualización 2D usando Three.js
 * Renderiza el grid como un canvas blanco con muros en los extremos
 */
class Visualization3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Contenedor no encontrado:', containerId);
            return;
        }
        console.log('Contenedor encontrado:', this.container);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.grid = null;
        this.cellSize = 1;
        
        // Materiales
        this.materials = {};
        
        // Animación
        this.animationId = null;
        this.animationStarted = false;
        
        // Carro para animación
        this.car = null;
        this.carPath = null;
        this.carIndex = 0;
        this.carSpeed = 0.02;
        this.isAnimating = false;
        this.carGrid = null; // Referencia al grid para verificar tipos de celda
        this.trafficEffect = null; // Efecto visual para tráfico
        
        this.init();
    }
    
    init() {
        console.log('Inicializando visualización 2D...');
        
        // Verificar que Three.js esté disponible
        if (typeof THREE === 'undefined') {
            console.error('Three.js no está disponible!');
            return;
        }
        console.log('Three.js está disponible:', THREE.REVISION);
        
        this.createScene();
        console.log('Escena creada');
        this.createMaterials();
        console.log('Materiales creados');
        this.createCamera();
        console.log('Cámara creada');
        this.createRenderer();
        console.log('Renderer creado');
        this.createLights();
        console.log('Luces creadas');
        this.setupControls();
        console.log('Controles configurados');
        this.animate();
        console.log('Animación iniciada');
        
        // Manejar redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());
        console.log('Visualización 2D inicializada correctamente');
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        // Fondo blanco para canvas
        this.scene.background = new THREE.Color(0x4B764C);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Posición fija para vista 2D satelital (90 grados hacia abajo)
        this.camera.position.set(15, 30, 15);
        this.camera.lookAt(15, 0, 15);
    }
    
    createRenderer() {
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            console.error('Canvas no encontrado!');
            return;
        }
        console.log('Canvas encontrado:', canvas);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            canvas: canvas
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        console.log('Renderer configurado con tamaño:', window.innerWidth, 'x', window.innerHeight);
    }
    
    createLights() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Luz direccional
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Luz puntual
        const pointLight = new THREE.PointLight(0x4CAF50, 0.5, 100);
        pointLight.position.set(25, 20, 25);
        this.scene.add(pointLight);
    }
    
    createMaterials() {
        this.materials = {
            empty: new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                transparent: false,
                opacity: 1.0
            }),
            wall: new THREE.MeshLambertMaterial({ 
                color: 0x2C2C2C, // Gris más oscuro
                transparent: false,
                opacity: 1.0
            }),
            traffic: new THREE.MeshLambertMaterial({
                color: 0xFFA500, // naranja para tráfico
                transparent: false,
                opacity: 1.0,
            }),
            start: new THREE.MeshLambertMaterial({ 
                color: 0x4CAF50,
                transparent: false,
                opacity: 1.0
            }),
            end: new THREE.MeshLambertMaterial({ 
                color: 0xF44336,
                transparent: false,
                opacity: 1.0
            }),
            path: new THREE.MeshLambertMaterial({ 
                color: 0x2196F3,
                transparent: false,
                opacity: 1.0
            })
        };
    }
    
    setupControls() {
        // Sin controles de cámara - solo vista 2D fija
        console.log('Controles de cámara deshabilitados - vista 2D fija');
    }
    
    createGrid(grid) {
        console.log('Creando grid con dimensiones:', grid.width, 'x', grid.height);
        
        // Limpiar grid anterior si existe
        if (this.grid) {
            console.log('Limpiando grid anterior');
            this.scene.remove(this.grid);
        }
        
        this.grid = new THREE.Group();
        console.log('Grupo de grid creado');
        
        // Crear suelo de pasto fuera del grid
        console.log('Creando suelo de pasto...');
        this.createGrassGround(grid);
        
        // Crear suelo gris del grid
        console.log('Creando suelo gris del grid...');
        this.createGridFloor(grid);
        
        // Crear líneas de grid para mostrar las celdas
        console.log('Creando líneas de grid');
        this.createGridLines(grid);
        
        // Crear muros en los extremos
        console.log('Creando muros en los extremos...');
        this.createEdgeWalls(grid);
        
        // Crear celdas del grid (solo las que no son empty)
        console.log('Creando celdas del grid...');
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const cell = grid.getCell(x, y);
                if (cell.type !== 'empty') {
                    this.createCell(cell, x, y);
                }
            }
        }
        
        this.scene.add(this.grid);
        console.log('Grid agregado a la escena');
    }
    
    createEdgeWalls(grid) {
        // Crear conos pequeños como límites del mapa que indican prohibición de paso
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Crear conos individuales en los bordes para indicar límites
        this.createEdgeWallSegments(grid, wallMaterial);
    }
    
    createEdgeWallSegments(grid, material) {
        // Conos superiores e inferiores
        for (let x = 0; x < grid.width; x++) {
            // Cono superior
            this.createEdgeWall(x, -1, grid, material);
            // Cono inferior
            this.createEdgeWall(x, grid.height, grid, material);
        }
        
        // Conos izquierdos y derechos
        for (let y = 0; y < grid.height; y++) {
            // Cono izquierdo
            this.createEdgeWall(-1, y, grid, material);
            // Cono derecho
            this.createEdgeWall(grid.width, y, grid, material);
        }
    }
    
    createEdgeWall(x, y, grid, material) {
        // Crear conos pequeños como límites del mapa
        const coneHeight = 0.3 + Math.random() * 0.2; // Altura entre 0.3 y 0.5
        const coneRadius = 0.15 + Math.random() * 0.1; // Radio entre 0.15 y 0.25
        
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 6);
        
        // Crear material con color rojo/naranja para indicar prohibición
        const coneColors = [0xFF4444, 0xFF6666, 0xFF8888, 0xFFAAAA]; // Diferentes tonos de rojo
        const randomColor = coneColors[Math.floor(Math.random() * coneColors.length)];
        const coneMaterial = new THREE.MeshLambertMaterial({ 
            color: randomColor,
            transparent: false,
            opacity: 1.0
        });
        
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        
        // Posición con pequeñas variaciones aleatorias
        const offsetX = (Math.random() - 0.5) * 0.3;
        const offsetZ = (Math.random() - 0.5) * 0.3;
        
        cone.position.set(
            x * this.cellSize + this.cellSize / 2 + offsetX,
            coneHeight / 2,
            y * this.cellSize + this.cellSize / 2 + offsetZ
        );
        
        // Rotación aleatoria para variedad
        cone.rotation.y = Math.random() * Math.PI * 2;
        cone.rotation.x = (Math.random() - 0.5) * 0.2;
        cone.rotation.z = (Math.random() - 0.5) * 0.2;
        
        cone.castShadow = true;
        cone.receiveShadow = true;
        
        this.grid.add(cone);
    }
    
    createGrassGround(grid) {
        // Crear suelo de pasto que se extiende más allá del grid
        const grassSize = Math.max(grid.width, grid.height) * 2; // Hacer el pasto más grande que el grid
        
        const grassGeometry = new THREE.PlaneGeometry(grassSize, grassSize);
        const grassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4CAF50, // Verde pasto
            side: THREE.DoubleSide
        });
        
        const grassGround = new THREE.Mesh(grassGeometry, grassMaterial);
        grassGround.rotation.x = -Math.PI / 2;
        grassGround.position.set(
            grid.width * this.cellSize / 2,
            -0.01, // Ligeramente por debajo del grid
            grid.height * this.cellSize / 2
        );
        
        this.grid.add(grassGround);
    }
    
    createGridFloor(grid) {
        // Crear suelo gris del grid
        const floorGeometry = new THREE.PlaneGeometry(
            grid.width * this.cellSize,
            grid.height * this.cellSize
        );
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666, // Gris más oscuro para el grid
            side: THREE.DoubleSide
        });
        
        const gridFloor = new THREE.Mesh(floorGeometry, floorMaterial);
        gridFloor.rotation.x = -Math.PI / 2;
        gridFloor.position.set(
            grid.width * this.cellSize / 2,
            0.001, // Ligeramente por encima del pasto
            grid.height * this.cellSize / 2
        );
        
        this.grid.add(gridFloor);
    }
    
    createGridLines(grid) {
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, // Líneas blancas para contrastar con el suelo gris
            transparent: true, 
            opacity: 0.8 
        });
        
        // Líneas verticales
        for (let x = 0; x <= grid.width; x++) {
            const geometry = new THREE.BufferGeometry();
            const points = [
                new THREE.Vector3(x * this.cellSize, 0.002, 0),
                new THREE.Vector3(x * this.cellSize, 0.002, grid.height * this.cellSize)
            ];
            geometry.setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.grid.add(line);
        }
        
        // Líneas horizontales
        for (let y = 0; y <= grid.height; y++) {
            const geometry = new THREE.BufferGeometry();
            const points = [
                new THREE.Vector3(0, 0.002, y * this.cellSize),
                new THREE.Vector3(grid.width * this.cellSize, 0.002, y * this.cellSize)
            ];
            geometry.setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.grid.add(line);
        }
    }
    
    createCell(cell, x, y) {
        let height, geometry, material, mesh;
        
        if (cell.type === 'wall') {
            // Muros 3D con altura aleatoria (reducida a la mitad)
            height = 0.5 + Math.random() * 1; // Altura entre 0.5 y 1 unidad
            
            geometry = new THREE.BoxGeometry(
                this.cellSize * 0.9,
                height,
                this.cellSize * 0.9
            );
            
            // Crear material con color aleatorio para variedad
            const wallColors = [0x2C2C2C, 0x404040, 0x555555, 0x1A1A1A, 0x333333]; // Diferentes tonos de gris
            const randomColor = wallColors[Math.floor(Math.random() * wallColors.length)];
            material = new THREE.MeshLambertMaterial({ 
                color: randomColor,
                transparent: false,
                opacity: 1.0
            });
            
            mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(
                x * this.cellSize + this.cellSize / 2,
                height / 2,
                y * this.cellSize + this.cellSize / 2
            );
            
            // Agregar variaciones aleatorias para hacer los muros más realistas
            mesh.rotation.y = (Math.random() - 0.5) * 0.1; // Rotación ligera
            mesh.scale.x = 0.8 + Math.random() * 0.4; // Ancho variable
            mesh.scale.z = 0.8 + Math.random() * 0.4; // Profundidad variable
            
        } else {
            // Otras celdas con altura fija
            height = 0.1;
            
            geometry = new THREE.BoxGeometry(
                this.cellSize * 0.9,
                height,
                this.cellSize * 0.9
            );
            
            material = this.materials[cell.type];
            mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(
                x * this.cellSize + this.cellSize / 2,
                height / 2,
                y * this.cellSize + this.cellSize / 2
            );
        }
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Agregar etiqueta para identificación
        mesh.userData = { cell: cell, gridX: x, gridY: y };
        
        this.grid.add(mesh);
    }
    
    updateGrid(grid) {
        // Actualizar solo las celdas que han cambiado
        if (!this.grid) return;
        
        // Limpiar celdas existentes
        const cellsToRemove = [];
        this.grid.children.forEach(child => {
            if (child.userData && child.userData.cell) {
                cellsToRemove.push(child);
            }
        });
        
        cellsToRemove.forEach(child => {
            this.grid.remove(child);
        });
        
        // Agregar nuevas celdas
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const cell = grid.getCell(x, y);
                if (cell.type !== 'empty') {
                    this.createCell(cell, x, y);
                }
            }
        }
    }
    
    worldToGrid(worldX, worldZ, cellSize) {
        // Convertir coordenadas del mundo 3D a coordenadas del grid
        const gridX = Math.floor(worldX / cellSize);
        const gridY = Math.floor(worldZ / cellSize);
        return { x: gridX, y: gridY };
    }
    
    /**
     * Cambiar a vista 3D (45 grados) para pathfinding
     */
    setCamera3D() {
        // Posición para vista 3D más inclinada (30 grados aproximadamente)
        this.camera.position.set(15, 20, 20);
        this.camera.lookAt(15, 0, 15);
    }
    
    /**
     * Volver a vista 2D (90 grados) para dibujo
     */
    setCamera2D() {
        // Posición para vista 2D satelital (90 grados hacia abajo)
        this.camera.position.set(15, 30, 15);
        this.camera.lookAt(15, 0, 15);
    }
    
    /**
     * Crear el carro para animación
     */
    createCar() {
        const carGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.8);
        const carMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        this.car = new THREE.Mesh(carGeometry, carMaterial);
        this.car.visible = false;
        this.scene.add(this.car);
    }
    
    /**
     * Crear efecto visual para tráfico (humo/partículas)
     */
    createTrafficEffect() {
        if (this.trafficEffect) {
            this.scene.remove(this.trafficEffect);
        }
        
        // Crear un pequeño efecto de humo usando geometría simple
        const smokeGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const smokeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.6 
        });
        
        this.trafficEffect = new THREE.Mesh(smokeGeometry, smokeMaterial);
        this.trafficEffect.visible = false;
        this.scene.add(this.trafficEffect);
    }
    
    /**
     * Animar el carro siguiendo el path
     */
    animateCar(path, grid = null) {
        if (!path || path.length === 0) return;
        
        // Crear carro si no existe
        if (!this.car) {
            this.createCar();
        }
        
        // Crear efecto de tráfico si no existe
        if (!this.trafficEffect) {
            this.createTrafficEffect();
        }
        
        this.car.visible = true;
        this.carPath = path;
        this.carGrid = grid; // Guardar referencia al grid para verificar tipos de celda
        this.carIndex = 0;
        this.carSpeed = 0.02; // Velocidad base
        this.isAnimating = true;
        
        console.log('Iniciando animación del carro con path de', path.length, 'celdas');
    }
    
    /**
     * Actualizar animación del carro con interpolación suave
     */
    updateCarAnimation() {
        if (!this.isAnimating || !this.carPath || this.carIndex >= this.carPath.length - 1) {
            this.isAnimating = false;
            if (this.car) {
                this.car.visible = false;
            }
            if (this.trafficEffect) {
                this.trafficEffect.visible = false;
            }
            return;
        }
        
        // Obtener el índice actual y el siguiente
        const currentIndex = Math.floor(this.carIndex);
        const nextIndex = Math.min(currentIndex + 1, this.carPath.length - 1);
        
        // Calcular el factor de interpolación (0.0 a 1.0)
        const t = this.carIndex - currentIndex;
        
        // Obtener las posiciones actual y siguiente
        const currentCell = this.carPath[currentIndex];
        const nextCell = this.carPath[nextIndex];
        
        // Determinar velocidad basada en el tipo de celda actual
        let currentSpeed = this.carSpeed;
        if (this.carGrid) {
            const cell = this.carGrid.getCell(currentCell.x, currentCell.y);
            if (cell) {
                switch (cell.type) {
                    case 'traffic':
                        // Muy lento en zonas de tráfico (30% de la velocidad normal)
                        currentSpeed = this.carSpeed * 0.3;
                        break;
                    case 'path':
                        // Velocidad normal en el camino
                        currentSpeed = this.carSpeed;
                        break;
                    case 'start':
                    case 'end':
                        // Velocidad normal en inicio y final
                        currentSpeed = this.carSpeed;
                        break;
                    default:
                        // Velocidad normal para celdas vacías
                        currentSpeed = this.carSpeed;
                        break;
                }
            }
        }
        
        const currentX = currentCell.x * this.cellSize + this.cellSize / 2;
        const currentZ = currentCell.y * this.cellSize + this.cellSize / 2;
        const nextX = nextCell.x * this.cellSize + this.cellSize / 2;
        const nextZ = nextCell.y * this.cellSize + this.cellSize / 2;
        
        // Interpolación lineal suave con easing
        const smoothT = this.easeInOutQuad(t);
        const interpolatedX = currentX + (nextX - currentX) * smoothT;
        const interpolatedZ = currentZ + (nextZ - currentZ) * smoothT;
        
        // Posicionar el carro
        this.car.position.set(interpolatedX, 0.3, interpolatedZ);
        
        // Cambiar color del carro y mostrar efecto si está en tráfico
        if (this.carGrid) {
            const cell = this.carGrid.getCell(currentCell.x, currentCell.y);
            if (cell && cell.type === 'traffic') {
                // Color rojo cuando está en tráfico
                this.car.material.color.setHex(0xFF4444);
                // Mostrar efecto de humo
                if (this.trafficEffect) {
                    this.trafficEffect.visible = true;
                    this.trafficEffect.position.set(interpolatedX, 0.5, interpolatedZ);
                    // Animar el efecto de humo
                    this.trafficEffect.rotation.y += 0.1;
                    this.trafficEffect.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.2);
                }
            } else {
                // Color dorado normal
                this.car.material.color.setHex(0xFFD700);
                // Ocultar efecto de humo
                if (this.trafficEffect) {
                    this.trafficEffect.visible = false;
                }
            }
        }
        
        // Calcular dirección hacia el siguiente punto
        const angle = Math.atan2(nextZ - currentZ, nextX - currentX);
        this.car.rotation.y = angle - Math.PI / 2; // Ajustar para que mire hacia adelante
        
        // Incrementar índice con velocidad ajustada
        this.carIndex += currentSpeed;
    }
    
    /**
     * Función de easing para movimiento suave
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Actualizar animación del carro
        this.updateCarAnimation();
        
        this.renderer.render(this.scene, this.camera);
        
        // Log solo una vez para verificar que está funcionando
        if (!this.animationStarted) {
            console.log('Renderizado iniciado correctamente');
            this.animationStarted = true;
        }
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Limpiar materiales
        Object.values(this.materials).forEach(material => {
            material.dispose();
        });
    }
}