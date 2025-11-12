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
    this.explosions = []; // Lista de explosiones activas
        
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
        // No usar color de fondo para que la skySphere sea visible
        this.scene.background = null;

        // Crear cielo simple (esfera invertida con gradiente)
        this.createSkySphere();
    }

    createSkySphere() {
        // Esfera muy grande invertida con un material que simula un gradiente de cielo
        const geom = new THREE.SphereGeometry(500, 32, 15);
        // Invertir normales para que se vea desde dentro
        geom.scale(-1, 1, 1);

        // Crear canvas para gradiente
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        const grd = ctx.createLinearGradient(0, 0, 0, size);
        grd.addColorStop(0, '#0b2b1a'); // top - oscuro
        grd.addColorStop(0.5, '#1b5e3a');
    grd.addColorStop(1, '#3e8e41'); // bottom - match grass hex #3e8e41

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;

        const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
        this.skySphere = new THREE.Mesh(geom, mat);
        this.scene.add(this.skySphere);
    }

    // (backdrop buildings removed)
    
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
        // Hacer que el renderer use el tamaño del contenedor principal en lugar de window
        const rect = this.container.getBoundingClientRect();
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            canvas: canvas,
            alpha: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        this.renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
    // Ajustar clear color para que no aparezca negro fuera del canvas
    this.renderer.setClearColor(0x3e8e41, 1); // match exact grass hex #3e8e41
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        console.log('Renderer configurado con tamaño del contenedor:', rect.width, 'x', rect.height);
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
        // Crear texturas procedurales simples usando Canvas para no depender de assets externos
        const grassTexture = this.createGrassTexture();
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(12, 12);

        const asphaltTexture = this.createAsphaltTexture();
        asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
        asphaltTexture.repeat.set(4, 4);

        const gridTileTexture = this.createGridTileTexture();
        gridTileTexture.wrapS = gridTileTexture.wrapT = THREE.RepeatWrapping;
        gridTileTexture.repeat.set(1, 1);

        this.materials = {
            empty: new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                metalness: 0.0,
                roughness: 0.9,
                map: gridTileTexture
            }),
            wall: new THREE.MeshStandardMaterial({ 
                color: 0x2C2C2C,
                metalness: 0.1,
                roughness: 0.7
            }),
            traffic: new THREE.MeshStandardMaterial({
                color: 0xFFA500,
                metalness: 0.0,
                roughness: 0.6
            }),
            start: new THREE.MeshStandardMaterial({ 
                color: 0x4CAF50,
                metalness: 0.2,
                roughness: 0.4
            }),
            end: new THREE.MeshStandardMaterial({ 
                color: 0xF44336,
                metalness: 0.2,
                roughness: 0.4
            }),
            path: new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                metalness: 0.0,
                roughness: 0.8
            }),
            grass: new THREE.MeshStandardMaterial({ 
                map: grassTexture,
                metalness: 0.0,
                roughness: 1.0
            }),
            asphalt: new THREE.MeshStandardMaterial({ 
                map: asphaltTexture,
                metalness: 0.0,
                roughness: 0.9
            })
        };
    }

    // Procedural grass texture (small canvas pattern)
    createGrassTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        // base
        ctx.fillStyle = '#3e8e41';
        ctx.fillRect(0, 0, size, size);

        // blades
        for (let i = 0; i < 200; i++) {
            ctx.strokeStyle = (Math.random() > 0.5) ? '#2f7a32' : '#4fb14a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 6, y - (1 + Math.random() * 6));
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // Procedural asphalt texture (small noise)
    createAsphaltTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        // base
        ctx.fillStyle = '#4b4b4b';
        ctx.fillRect(0, 0, size, size);

        // speckles
        for (let i = 0; i < 800; i++) {
            const v = Math.random() * 60;
            ctx.fillStyle = `rgb(${80 + v}, ${80 + v}, ${80 + v})`;
            ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // Simple tiled grid tile texture (subtle highlight)
    createGridTileTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(0, 0, size, size / 2);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
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
        // Guardar dimensiones y centro del grid para posicionar cámaras dinámicamente
        try {
            this.gridWidth = grid.width;
            this.gridHeight = grid.height;
            this.gridCenterX = grid.width * this.cellSize / 2;
            this.gridCenterZ = grid.height * this.cellSize / 2;
        } catch (e) {
            // no critical
        }
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
    const grassSize = Math.max(grid.width, grid.height) * 5; // Hacer el pasto mucho más grande que el grid
        
        const grassGeometry = new THREE.PlaneGeometry(grassSize, grassSize);
        // Usar material procedural si está disponible
        const grassMaterial = (this.materials && this.materials.grass) ? this.materials.grass : new THREE.MeshLambertMaterial({ color: 0x4CAF50, side: THREE.DoubleSide });
        
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
        // Usar material procedural (asphalt) si está disponible
        const floorMaterial = (this.materials && this.materials.asphalt) ? this.materials.asphalt : new THREE.MeshLambertMaterial({ color: 0x666666, side: THREE.DoubleSide });
        
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
            // Muros 3D usando propiedades visuales almacenadas en la celda
            const v = cell.visual || {};
            height = v.height || (0.5 + Math.random() * 1);

            geometry = new THREE.BoxGeometry(
                this.cellSize * 0.9,
                height,
                this.cellSize * 0.9
            );

            const color = v.color || 0x2C2C2C;
            material = new THREE.MeshLambertMaterial({ 
                color: color,
                transparent: false,
                opacity: 1.0
            });

            mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(
                x * this.cellSize + this.cellSize / 2,
                height / 2,
                y * this.cellSize + this.cellSize / 2
            );

            // Aplicar transformaciones guardadas
            mesh.rotation.y = (v.rotationY !== undefined) ? v.rotationY : ((Math.random() - 0.5) * 0.1);
            mesh.scale.x = (v.scaleX !== undefined) ? v.scaleX : (0.8 + Math.random() * 0.4);
            mesh.scale.z = (v.scaleZ !== undefined) ? v.scaleZ : (0.8 + Math.random() * 0.4);

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

        // (El camino ahora se representa como celdas de tipo 'path' con material blanco)
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
        // Posición para vista 3D ajustada dinámicamente según tamaño del grid
        const cx = (this.gridCenterX !== undefined) ? this.gridCenterX : 15;
        const cz = (this.gridCenterZ !== undefined) ? this.gridCenterZ : 15;
        const maxDim = Math.max(this.gridWidth || 30, this.gridHeight || 30);

    // Ajustar la cámara para que quede más cerca del tablero
    const baseY = Math.max(8, Math.floor(maxDim * 0.45));
    const y = baseY + 10; // altura moderada

    // Reducir offset Z para acercar la cámara al tablero
    const zOffset = Math.max(8, Math.floor(maxDim * 0.4));

    this.camera.position.set(cx, y, cz + zOffset);
        this.camera.lookAt(cx, 0, cz);
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
     * Crear una explosión visual en coordenadas del mundo (x,z)
     */
    createExplosionAt(worldX, worldZ) {
        const geom = new THREE.SphereGeometry(1, 64, 48);
        const mat = new THREE.MeshBasicMaterial({ color: 0xFF4444, transparent: false, opacity: 1.0 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(worldX, 0.3, worldZ);
        mesh.scale.setScalar(0.1);
        mesh.userData = { life: 0, duration: 90 }; // frames
        this.scene.add(mesh);
        this.explosions.push(mesh);
    }

    /**
     * Detiene el carro y crea una explosión en su posición actual
     */
    explodeAtCarAndStop() {
        if (this.car) {
            const worldX = this.car.position.x;
            const worldZ = this.car.position.z;
            this.stopCarAnimation();
            this.createExplosionAt(worldX, worldZ);
        }
    }

    /**
     * Obtener la celda del grid donde actualmente está el carro (aproximado)
     */
    getCarCurrentCell() {
        if (!this.car) return null;
        const x = Math.floor(this.car.position.x / this.cellSize);
        const y = Math.floor(this.car.position.z / this.cellSize);
        if (x < 0 || x >= (this.carGrid ? this.carGrid.width : 9999) || y < 0 || y >= (this.carGrid ? this.carGrid.height : 9999)) {
            return null;
        }
        return { x: x, y: y };
    }

    /**
     * Reemplaza la ruta del carro intentando preservar su posición actual (aproximado)
     */
    setCarPathPreservePosition(newPath, grid = null) {
        if (!newPath || newPath.length === 0) return;
        if (!this.car) this.createCar();

        // Guardar referencia al grid
        this.carGrid = grid;

        // Encontrar índice más cercano en la nueva ruta a la posición actual del carro
        let bestIndex = 0;
        if (this.car && this.car.visible) {
            let bestDist = Infinity;
            const cx = this.car.position.x;
            const cz = this.car.position.z;
            for (let i = 0; i < newPath.length; i++) {
                const p = newPath[i];
                const px = p.x * this.cellSize + this.cellSize / 2;
                const pz = p.y * this.cellSize + this.cellSize / 2;
                const d = Math.hypot(px - cx, pz - cz);
                if (d < bestDist) {
                    bestDist = d;
                    bestIndex = i;
                }
            }
        }

        this.carPath = newPath;
        this.carIndex = bestIndex;
        this.isAnimating = true;
        this.car.visible = true;
    }
    
    /**
     * Función de easing para movimiento suave
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    onWindowResize() {
        const rect = this.container.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Actualizar animación del carro
        this.updateCarAnimation();
        
        // Actualizar explosiones
        if (this.explosions && this.explosions.length > 0) {
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const e = this.explosions[i];
                e.userData.life++;
                const t = e.userData.life / e.userData.duration;
                e.scale.setScalar(0.1 + t * 1.5);
                e.material.opacity = Math.max(0, 1 - t);
                if (e.userData.life >= e.userData.duration) {
                    // remover
                    this.scene.remove(e);
                    this.explosions.splice(i, 1);
                }
            }
        }
        
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

    /**
     * Detiene la animación del carro inmediatamente y oculta efectos.
     */
    stopCarAnimation() {
        this.isAnimating = false;
        this.carPath = null;
        this.carIndex = 0;
        if (this.car) {
            this.car.visible = false;
        }
        if (this.trafficEffect) {
            this.trafficEffect.visible = false;
        }
    }
}