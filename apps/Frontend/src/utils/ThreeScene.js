import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/* ===========================
   3D MODEL LOADER & SCENE MANAGER
   =========================== */

export default class ThreeScene {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.models = [];
        this.mouse = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.animationId = null;
        
        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Wait for container dimensions if necessary, or just use window
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        
        // Camera
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 8;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        
        // IMPORTANT: Use SRGB color space to prevent models from looking dark and washed out
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLights();
        
        // Bindings
        this._onWindowResize = this.onWindowResize.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        
        // Event listeners
        window.addEventListener('resize', this._onWindowResize);
        window.addEventListener('mousemove', this._onMouseMove);
        
        // Start animation
        this.animate();
    }

    setupLights() {
        // Hemisphere light acts like natural sky/ground lighting (sunlight)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        // Strong directional light acting as the main sun
        const directional = new THREE.DirectionalLight(0xffffff, 3.5);
        directional.position.set(10, 20, 10);
        this.scene.add(directional);
        
        // Ambient light (base fill light)
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambient);
        
        // Point lights for accent
        const pointLight1 = new THREE.PointLight(0x00d9ff, 1, 50);
        pointLight1.position.set(-10, 5, 5);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff006e, 0.8, 50);
        pointLight2.position.set(10, -5, 5);
        this.scene.add(pointLight2);
    }

    loadModel(path, position, scale = 1, rotation = { x: 0, y: 0, z: 0 }) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            const dracoLoader = new DRACOLoader();
            // Typically points to draco decoders directory, can be public folder or CDN
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            loader.setDRACOLoader(dracoLoader);
            
            loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    model.position.set(position.x, position.y, position.z);
                    model.scale.set(scale, scale, scale);
                    model.rotation.set(rotation.x, rotation.y, rotation.z);
                    
                    // Initialize model properties
                    model.userData = {
                        originalScale: scale,
                        originalPosition: { ...position },
                        floatOffset: Math.random() * Math.PI * 2,
                        floatSpeed: 0.5 + Math.random() * 0.5,
                        isHovered: false,
                        rotationSpeed: 0.01 + Math.random() * 0.01
                    };
                    
                    this.scene.add(model);
                    this.models.push(model);
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.error(`Error loading model ${path}:`, error);
                    reject(error);
                }
            );
        });
    }

    loadImage(imagePath, position, scale = 1) {
        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                imagePath,
                (texture) => {
                    // Create plane geometry
                    const geometry = new THREE.PlaneGeometry(scale * 1.5, scale * 1.5);
                    const material = new THREE.MeshBasicMaterial({ 
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        toneMapped: false
                    });
                    const plane = new THREE.Mesh(geometry, material);
                    
                    // Position
                    plane.position.set(position.x, position.y, position.z);
                    
                    // Setup user data for animations
                    plane.userData = {
                        originalScale: scale,
                        originalPosition: { ...position },
                        floatOffset: Math.random() * Math.PI * 2,
                        floatSpeed: 0.5 + Math.random() * 0.5,
                        isHovered: false,
                        rotationSpeed: 0 // images don't usually rotate like 3D models unless desired
                    };
                    
                    this.scene.add(plane);
                    this.models.push(plane);
                    console.log('Image loaded successfully:', imagePath);
                    resolve(plane);
                },
                (progress) => {
                    // console.log('Image loading progress:', progress);
                },
                (error) => {
                    console.error(`Error loading image ${imagePath}:`, error);
                    reject(error);
                }
            );
        });
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycasting for hover detection
        this.mouseVector.set(this.mouse.x, this.mouse.y);
        this.raycaster.setFromCamera(this.mouseVector, this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.models, true);
        
        // Reset all models
        this.models.forEach(model => {
            if (model.userData.isHovered && intersects.length === 0) {
                model.userData.isHovered = false;
            }
        });
        
        // Set hovered model
        if (intersects.length > 0) {
            let parentModel = intersects[0].object;
            while (parentModel.parent && !this.models.includes(parentModel)) {
                parentModel = parentModel.parent;
            }
            if (this.models.includes(parentModel)) {
                parentModel.userData.isHovered = true;
            }
        }
    }

    onWindowResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Animate models
        this.models.forEach((model) => {
            const data = model.userData;
            if (!data) return;
            
            // Floating animation
            model.position.y = data.originalPosition.y + Math.sin(time * data.floatSpeed + data.floatOffset) * 0.3;
            
            // Continuous rotation
            if (data.rotationSpeed) {
                model.rotation.x += 0.005;
                model.rotation.y += data.rotationSpeed;
                model.rotation.z += 0.003;
            }
            
            // Hover effect
            const targetScale = data.isHovered ? data.originalScale * 1.3 : data.originalScale;
            model.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.1
            );
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Clean up to prevent memory leaks in React
    dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this._onWindowResize);
        window.removeEventListener('mousemove', this._onMouseMove);
        
        // Clean up models
        this.models.forEach(model => {
            this.scene.remove(model);
        });
        
        // Clean up renderer
        if (this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
    }
}
