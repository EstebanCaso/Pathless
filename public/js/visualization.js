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
        this.scene.background = new THREE.Color(0xffffff);
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
                color: 0x333333,
                transparent: false,
                opacity: 1.0
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
        
        // No crear suelo base - solo líneas de grid
        
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
        // Crear muros solo en los bordes exteriores del grid
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Muro superior (solo una línea)
        const topWallGeometry = new THREE.BoxGeometry(grid.width * this.cellSize, 0.2, 0.1);
        const topWall = new THREE.Mesh(topWallGeometry, wallMaterial);
        topWall.position.set(grid.width * this.cellSize / 2, 0.1, -0.05);
        this.grid.add(topWall);
        
        // Muro inferior (solo una línea)
        const bottomWallGeometry = new THREE.BoxGeometry(grid.width * this.cellSize, 0.2, 0.1);
        const bottomWall = new THREE.Mesh(bottomWallGeometry, wallMaterial);
        bottomWall.position.set(grid.width * this.cellSize / 2, 0.1, grid.height * this.cellSize + 0.05);
        this.grid.add(bottomWall);
        
        // Muro izquierdo (solo una línea)
        const leftWallGeometry = new THREE.BoxGeometry(0.1, 0.2, grid.height * this.cellSize);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-0.05, 0.1, grid.height * this.cellSize / 2);
        this.grid.add(leftWall);
        
        // Muro derecho (solo una línea)
        const rightWallGeometry = new THREE.BoxGeometry(0.1, 0.2, grid.height * this.cellSize);
        const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
        rightWall.position.set(grid.width * this.cellSize + 0.05, 0.1, grid.height * this.cellSize / 2);
        this.grid.add(rightWall);
    }
    
    createGridLines(grid) {
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xe0e0e0, 
            transparent: true, 
            opacity: 0.5 
        });
        
        // Líneas verticales
        for (let x = 0; x <= grid.width; x++) {
            const geometry = new THREE.BufferGeometry();
            const points = [
                new THREE.Vector3(x * this.cellSize, 0.001, 0),
                new THREE.Vector3(x * this.cellSize, 0.001, grid.height * this.cellSize)
            ];
            geometry.setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.grid.add(line);
        }
        
        // Líneas horizontales
        for (let y = 0; y <= grid.height; y++) {
            const geometry = new THREE.BufferGeometry();
            const points = [
                new THREE.Vector3(0, 0.001, y * this.cellSize),
                new THREE.Vector3(grid.width * this.cellSize, 0.001, y * this.cellSize)
            ];
            geometry.setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.grid.add(line);
        }
    }
    
    createCell(cell, x, y) {
        // Altura fija para vista 2D
        const height = 0.1;
        
        const geometry = new THREE.BoxGeometry(
            this.cellSize * 0.9,
            height,
            this.cellSize * 0.9
        );
        
        const material = this.materials[cell.type];
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(
            x * this.cellSize + this.cellSize / 2,
            height / 2,
            y * this.cellSize + this.cellSize / 2
        );
        
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
     * Animar el carro siguiendo el path
     */
    animateCar(path) {
        if (!path || path.length === 0) return;
        
        // Crear carro si no existe
        if (!this.car) {
            this.createCar();
        }
        
        this.car.visible = true;
        this.carPath = path;
        this.carIndex = 0;
        this.carSpeed = 0.03; // Velocidad más lenta para interpolación suave
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
        
        // Calcular dirección hacia el siguiente punto
        const angle = Math.atan2(nextZ - currentZ, nextX - currentX);
        this.car.rotation.y = angle;
        
        // Incrementar índice
        this.carIndex += this.carSpeed;
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