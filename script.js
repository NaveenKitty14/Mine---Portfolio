/**
 * 3D Portfolio Website - Main JavaScript
 * 
 * This script implements an immersive 3D experience with page transitions
 * where new content emerges from within the current view.
 */

// ==========================================================================
// 1. Global Variables & Initialization
// ==========================================================================

// DOM Elements
const experienceContainer = document.getElementById('experience-container');
const mainCanvas = document.getElementById('main-canvas');
const loadingScreen = document.querySelector('.loading-screen');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const sectionIndicators = document.querySelectorAll('.indicator');
const projectItems = document.querySelectorAll('.project-item');
const projectModal = document.querySelector('.project-modal');
const modalClose = document.querySelector('.modal-close');
const modalOverlay = document.querySelector('.modal-overlay');
const modalContent = document.querySelector('.modal-content');
const audioToggle = document.querySelector('.audio-toggle');
const customCursor = document.querySelector('.custom-cursor');
const cursorFollower = document.querySelector('.cursor-follower');
const contactForm = document.getElementById('contact-form');
const ctaButtons = document.querySelectorAll('.cta-button');

// State Management
let currentSection = 'home';
let isTransitioning = false;
let isModalOpen = false;
let isAudioPlaying = false;
let isMobile = window.innerWidth < 768;
let backgroundAudio;

// Three.js Variables
let renderer, scene, camera, clock;
let models = {};
let particles;

// Configuration
// Configuration
const config = {
    transitionDuration: 1.2, // seconds
    cameraDistance: 5,
    particleCount: isMobile ? 800 : 3000, // Adjusted for mobile
    particleSize: 0.03,
    typingTexts: [
        { text: "Full-Stack Developer", color: "#fff" }, // Example color
        { text: "Graphic Designer", color: "#fff" },
        { text: "UI/UX Designer", color: "#fff" },
        { text: "Web Designer", color: "#FFF" },
    ]
};

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupThreeJS();
    setupLoadingScreen();
    setupEventListeners();
    setupCustomCursor();
    setupAudio();
    setupTypingEffect();
    setupStarInteractivity(); // Add this line
    
    // Start loading assets
    loadAssets();
}

// ==========================================================================
// 2. Custom Cursor Implementation
// ==========================================================================

function setupCustomCursor() {
    // Only setup custom cursor if elements exist
    if (!customCursor || !cursorFollower) return;
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    
    // Update cursor position on mouse move
    document.addEventListener('mousemove', updateCursorPosition);
    
    // Add click effect
    document.addEventListener('mousedown', () => {
        customCursor.classList.add('cursor-click');
    });
    
    document.addEventListener('mouseup', () => {
        customCursor.classList.remove('cursor-click');
    });
    
    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .project-item, .timeline-item, .skills-category, .indicator');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            customCursor.classList.add('cursor-hover');
            cursorFollower.classList.add('cursor-follower-hover');
        });
        
        element.addEventListener('mouseleave', () => {
            customCursor.classList.remove('cursor-hover');
            cursorFollower.classList.remove('cursor-follower-hover');
        });
    });
}

function updateCursorPosition(e) {
    // Update custom cursor position
    gsap.to(customCursor, {
        duration: 0.1,
        left: e.clientX,
        top: e.clientY
    });
    
    // Update follower with slight delay for smooth effect
    gsap.to(cursorFollower, {
        duration: 0.3,
        left: e.clientX,
        top: e.clientY
    });
}

// ==========================================================================
// 3. Loading Screen Management
// ==========================================================================

function setupLoadingScreen() {
    // Only setup if loading screen exists
    if (!loadingScreen) return;
    
    // Initial setup - ensure loading screen is visible
    loadingScreen.style.opacity = '1';
    loadingScreen.style.visibility = 'visible';
}

function loadAssets() {
    const totalAssets = 10; // Adjust based on actual number of assets
    let loadedAssets = 0;
    
    // Function to update loading progress
    function updateProgress() {
        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        updateLoadingProgress(progress);
        
        if (loadedAssets >= totalAssets) {
            completeLoading();
        }
    }
    
    // Simulate loading of assets (replace with actual asset loading in production)
    for (let i = 0; i < totalAssets; i++) {
        setTimeout(updateProgress, 200 * i);
    }
    
    // In a real implementation, you would load actual 3D models, textures, etc.
    // Example:
    // const textureLoader = new THREE.TextureLoader();
    // textureLoader.load('path/to/texture.jpg', () => {
    //     updateProgress();
    // });
}

function updateLoadingProgress(progress) {
    if (!progressFill || !progressText) return;
    
    gsap.to(progressFill, {
        width: `${progress}%`,
        duration: 0.3,
        ease: "power1.out"
    });
    
    progressText.textContent = `${Math.round(progress)}%`;
}

function completeLoading() {
    if (!loadingScreen) return;
    
    // Fade out loading screen
    gsap.to(loadingScreen, {
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
            loadingScreen.style.visibility = 'hidden';
            
            // Initialize section-specific elements
            initSectionAnimations();
            
            // Set initial section as active
            activateSection(currentSection);
        }
    });
}

// ==========================================================================
// 4. Three.js Scene Setup
// ==========================================================================

function setupThreeJS() {
    // Only setup if canvas exists
    if (!mainCanvas) return;

    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = config.cameraDistance;

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: mainCanvas,
        antialias: true,
        alpha: true // Allows for a transparent background
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Set the clear color to black
    renderer.setClearColor(0x000000); // Black background

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Setup clock for animations
    clock = new THREE.Clock();
    
    // Create particle system
    createParticleSystem();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function createParticleSystem() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = isMobile ? 800 : 3000; // Adjusted for mobile

    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);
    const velocities = [];

    for (let i = 0; i < starCount; i++) {
        const radius = THREE.MathUtils.randFloat(1, 15);
        const spinAngle = radius * 0.35;
        const branchAngle = (i % 3) * Math.PI * 2 / 3;

        const randomX = THREE.MathUtils.randFloatSpread(1.5);
        const randomY = THREE.MathUtils.randFloatSpread(1.5);
        const randomZ = THREE.MathUtils.randFloatSpread(1.5);

        const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
        const y = THREE.MathUtils.randFloatSpread(2.5) + randomY;
        const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z - 10; // Offset for camera

        const size = THREE.MathUtils.randFloat(0.04, 0.25) * (1 - radius / 20);
        sizes[i] = size;

        // Define star colors
        let r, g, b;
        if (radius > 10) {
            r = THREE.MathUtils.randFloat(0.8, 1.0); // Yellow
            g = THREE.MathUtils.randFloat(0.8, 1.0);
            b = 0.0;
        } else if (radius > 5) {
            r = THREE.MathUtils.randFloat(0.0, 0.2); // Light blue
            g = THREE.MathUtils.randFloat(0.4, 0.7);
            b = 1.0;
        } else {
            r = THREE.MathUtils.randFloat(0.0, 0.3); // Bright blue
            g = THREE.MathUtils.randFloat(0.3, 0.6);
            b = 1.0;
        }

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;

        velocities.push({
            rotationSpeed: (1 - radius / 20) * 0.0012,
            originalRadius: radius,
            originalAngle: branchAngle + spinAngle,
            pulseSpeed: THREE.MathUtils.randFloat(0.01, 0.04),
            pulseOffset: Math.random() * Math.PI * 2
        });
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pixelRatio: { value: window.devicePixelRatio }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                if (r > 0.5) discard;
                float alpha = 1.0 - smoothstep(0.3, 0.5, r);
                vec3 glow = vColor * (1.0 - r * 2.0);
                gl_FragColor = vec4(vColor * alpha + glow * 0.3, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);

    particles = {
        system: starSystem,
        geometry: starGeometry,
        material: starMaterial,
        positions: positions,
        velocities: velocities,
        count: starCount
    };
}


function updateParticles() {
    if (!particles || !particles.system) return;
    
    const positions = particles.positions;
    const velocities = particles.velocities;
    const time = clock.getElapsedTime();
    
    // Update time uniform for shader
    particles.material.uniforms.time.value = time;
    
    for (let i = 0; i < particles.count; i++) {
        const velocity = velocities[i];
        const originalRadius = velocity.originalRadius;
        const originalAngle = velocity.originalAngle;
        const rotationSpeed = velocity.rotationSpeed;
        
        // Calculate new position based on rotation around center
        const newAngle = originalAngle + time * rotationSpeed;
        
        // Add pulsing effect to radius (more subtle)
        const pulseEffect = Math.sin(time * velocity.pulseSpeed + velocity.pulseOffset) * 0.08 + 1;
        const radius = originalRadius * pulseEffect;
        
        // Update position
        positions[i * 3] = Math.cos(newAngle) * radius;
        positions[i * 3 + 2] = Math.sin(newAngle) * radius - 10; // Keep z offset
        
        // Very subtle vertical movement
        positions[i * 3 + 1] += Math.sin(time * 0.08 + i) * 0.0005;
        
        // Wrap stars if they go too far
        if (positions[i * 3 + 1] > 5) positions[i * 3 + 1] = -5;
        if (positions[i * 3 + 1] < -5) positions[i * 3 + 1] = 5;
    }
    
    // Update geometry
    particles.geometry.attributes.position.needsUpdate = true;
    
    // Rotate entire galaxy (slower for more elegant movement)
    particles.system.rotation.y += 0.00008;
    particles.system.rotation.x = Math.sin(time * 0.03) * 0.08;
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!renderer || !scene || !camera) return;
    
    const delta = clock.getDelta();
    
    // Update particles
    updateParticles();
    
    // Update section-specific 3D elements
    updateSectionElements(delta);
    
    // Render scene
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Check if mobile state changed
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;
    
    if (wasMobile !== isMobile) {
        // Update particle count based on device
        updateParticleCount(isMobile ? 800 : 3000); // Decreased star count
    }
}

function updateParticleCount(count) {
    if (!scene || !particles) return;
    
    // Remove old particle system
    scene.remove(particles.system);
    
    // Update config
    config.particleCount = count;
    
    // Recreate particles
    createParticleSystem();
}


function updateParticleCount(count) {
    if (!scene || !particles) return;
    
    // Remove old particle system
    scene.remove(particles.system);
    
    // Update config
    config.particleCount = count;
    
    // Recreate particles
    createParticleSystem();
}

// ==========================================================================
// 5. Section-Specific 3D Elements
// ==========================================================================

function initSectionAnimations() {
    // Initialize 3D elements for each section
    initHomeScene();
    initAboutScene();
    initSkillsScene();
    initProjectsScene();
    initExperienceScene();
    initContactScene();
}


function initAboutScene() {
    if (!scene) return;
    
    // Create 3D elements for about section
    const geometry = new THREE.DodecahedronGeometry(0.5);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x64ffda,
        wireframe: true
    });
    
    const dodecahedron = new THREE.Mesh(geometry, material);
    dodecahedron.position.set(-2, 1, -3);
    dodecahedron.visible = false; // Initially hidden
    scene.add(dodecahedron);
    
    models.aboutModel = dodecahedron;
}

function initSkillsScene() {
    if (!scene) return;
    
    // Create floating icons for skills
    const skillsGroup = new THREE.Group();
    
    const geometries = [
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.SphereGeometry(0.3, 32, 32),
        new THREE.ConeGeometry(0.3, 0.5, 32),
        new THREE.TorusGeometry(0.3, 0.1, 16, 100),
        new THREE.TetrahedronGeometry(0.4)
    ];
    
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x64ffda,
        metalness: 0.2,
        roughness: 0.8
    });
    
    geometries.forEach((geometry, index) => {
        const mesh = new THREE.Mesh(geometry, material);
        const angle = (index / geometries.length) * Math.PI * 2;
        const radius = 2;
        
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.y = Math.sin(angle) * radius;
        mesh.position.z = -3;
        
        skillsGroup.add(mesh);
    });
    
    skillsGroup.visible = false; // Initially hidden
    scene.add(skillsGroup);
    models.skillsModel = skillsGroup;
}

function initProjectsScene() {
    if (!scene) return;
    
    // Create project showcases
    const projectGroup = new THREE.Group();
    
    // Create a "gallery" of planes for projects
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.PlaneGeometry(1, 0.75);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x64ffda,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const plane = new THREE.Mesh(geometry, material);
        
        const angle = (i / 5) * Math.PI * 2;
        const radius = 3;
        
        plane.position.x = Math.cos(angle) * radius;
        plane.position.y = Math.sin(angle) * radius;
        plane.position.z = -3;
        
        plane.lookAt(0, 0, 0);
        
        projectGroup.add(plane);
    }
    
    projectGroup.visible = false; // Initially hidden
    scene.add(projectGroup);
    models.projectsModel = projectGroup;
}

function initExperienceScene() {
    if (!scene) return;
    
    // Create timeline visualization
    const timelineGroup = new THREE.Group();
    
    // Create a line for the timeline
    const points = [];
    points.push(new THREE.Vector3(-2, -1, -3));
    points.push(new THREE.Vector3(2, 1, -3));
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x64ffda });
    const timeline = new THREE.Line(lineGeometry, lineMaterial);
    
    timelineGroup.add(timeline);
    
    // Add dots for timeline events
    for (let i = 0; i < 4; i++) {
        const t = i / 3; // Normalized position along the line
        
        const dotGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const dotMaterial = new THREE.MeshStandardMaterial({ color: 0x64ffda });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        
        // Position along the line
        dot.position.x = -2 + t * 4;
        dot.position.y = -1 + t * 2;
        dot.position.z = -3;
        
        timelineGroup.add(dot);
    }
    
    timelineGroup.visible = false; // Initially hidden
    scene.add(timelineGroup);
    models.experienceModel = timelineGroup;
}

function initContactScene() {
    if (!scene) return;
    
    // Create envelope or message visualization
    const envelopeGroup = new THREE.Group();
    
    // Create an "envelope" shape
    const baseGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x64ffda,
        metalness: 0.2,
        roughness: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    
    envelopeGroup.add(base);
    
    // Add a paper "coming out" of the envelope
    const paperGeometry = new THREE.PlaneGeometry(1.2, 0.8);
    const paperMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.position.z = 0.1;
    paper.rotation.x = Math.PI / 6;
    
    envelopeGroup.add(paper);
    
    envelopeGroup.position.set(1, 0, -3);
    envelopeGroup.visible = false; // Initially hidden
    scene.add(envelopeGroup);
    
    models.contactModel = envelopeGroup;
}

function updateSectionElements(delta) {
    // Update models based on current section and time
    
    // Home model animation
    if (models.homeModel && models.homeModel.visible) {
        models.homeModel.rotation.x += 0.005;
        models.homeModel.rotation.y += 0.01;
    }
    
    // About model animation
    if (models.aboutModel && models.aboutModel.visible) {
        models.aboutModel.rotation.y += 0.01;
        models.aboutModel.position.y = 1 + Math.sin(clock.getElapsedTime()) * 0.1;
    }
    
    // Skills model animation
    if (models.skillsModel && models.skillsModel.visible) {
        models.skillsModel.rotation.y += 0.005;
        
        models.skillsModel.children.forEach((child, index) => {
            child.rotation.x += 0.01 * (index % 3 + 1);
            child.rotation.y += 0.01 * (index % 2 + 1);
        });
    }
    
    // Projects model animation
    if (models.projectsModel && models.projectsModel.visible) {
        models.projectsModel.rotation.y += 0.002;
        
        models.projectsModel.children.forEach((child, index) => {
            // Make projects float up and down slightly out of sync
            child.position.y += Math.sin(clock.getElapsedTime() + index) * 0.002;
        });
    }
    
    // Experience model animation
    if (models.experienceModel && models.experienceModel.visible) {
        models.experienceModel.children.forEach((child, index) => {
            // Skip the line (first child)
            if (index > 0) {
                // Pulse the timeline dots
                const scale = 1 + 0.2 * Math.sin(clock.getElapsedTime() * 2 + index);
                child.scale.set(scale, scale, scale);
            }
        });
    }
    
    // Contact model animation
    if (models.contactModel && models.contactModel.visible) {
        models.contactModel.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
        models.contactModel.position.y = Math.sin(clock.getElapsedTime()) * 0.1;
    }
}

// ==========================================================================
// 6. Navigation & Section Transitions
// ==========================================================================

function setupEventListeners() {
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            if (targetSection && !isTransitioning) {
                navigateToSection(targetSection);
                
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    toggleMobileMenu();
                }
            }
        });
    });
    
    // CTA buttons
    ctaButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.getAttribute('data-section');
            if (targetSection && !isTransitioning) {
                navigateToSection(targetSection);
            }
        });
    });
    
    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Section indicators
    sectionIndicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            const targetSection = indicator.getAttribute('data-section');
            if (targetSection && !isTransitioning) {
                navigateToSection(targetSection);
            }
        });
    });
    
    // Project items for modal
    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.getAttribute('data-project');
            openProjectModal(projectId);
        });
    });
    
    // Modal close button
    if (modalClose) {
        modalClose.addEventListener('click', closeProjectModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeProjectModal);
    }
    
    // Contact form submission
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Audio toggle
    if (audioToggle) {
        audioToggle.addEventListener('click', toggleAudio);
    }
    
    // Scroll event for navigation
    document.addEventListener('wheel', handleScroll);
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyNavigation);
}

function toggleMobileMenu() {
    if (!menuToggle || !mobileMenu) return;
    
    menuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
}

function navigateToSection(targetSection) {
    if (currentSection === targetSection || isTransitioning) return;
    
    isTransitioning = true;
    
    // Hide all section 3D elements
    hideAllSectionElements();
    
    // Update classes for visual transition
    const currentSectionElement = document.getElementById(currentSection);
    const targetSectionElement = document.getElementById(targetSection);
    
    if (!currentSectionElement || !targetSectionElement) {
        isTransitioning = false;
        return;
    }
    
    currentSectionElement.classList.remove('active');
    currentSectionElement.classList.add('prev');
    
    targetSectionElement.classList.add('active');
    
    // Update indicators
    updateSectionIndicators(targetSection);
    
    // Transition the 3D scene
    transitionScene(currentSection, targetSection);
    
    // Update current section
    currentSection = targetSection;
    
    // Reset transition lock after animation completes
    setTimeout(() => {
        document.querySelectorAll('.section.prev').forEach(section => {
            section.classList.remove('prev');
        });
        isTransitioning = false;
        
        // Show current section 3D elements
        showSectionElements(targetSection);
    }, config.transitionDuration * 1000);
}

function hideAllSectionElements() {
    // Hide all section-specific 3D elements
    Object.values(models).forEach(model => {
        if (model) model.visible = false;
    });
}

function showSectionElements(section) {
    // Show 3D elements for the current section
    const modelKey = section + 'Model';
    if (models[modelKey]) {
        models[modelKey].visible = true;
    }
}

function updateSectionIndicators(activeSection) {
    if (!sectionIndicators) return;
    
    sectionIndicators.forEach(indicator => {
        const section = indicator.getAttribute('data-section');
        if (section === activeSection) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

function transitionScene(fromSection, toSection) {
    if (!camera) return;
    
    // Define target camera positions for each section
    const cameraPositions = {
        home: { x: 0, y: 0, z: 5 },
        about: { x: -2, y: 1, z: 4 },
        skills: { x: 2, y: -1, z: 4 },
        projects: { x: 0, y: 2, z: 4 },
        experience: { x: -1, y: -2, z: 4 },
        contact: { x: 1, y: 0, z: 3 }
    };
    
    // Get target position
    const targetPos = cameraPositions[toSection];
    if (!targetPos) return;
    
    // Animate galaxy during transition
    if (particles && particles.system) {
        // Subtle zoom effect for stars
        gsap.to(particles.system.position, {
            z: 3,
            duration: config.transitionDuration / 2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
        
        // Gentle rotation during transition
        gsap.to(particles.system.rotation, {
            y: particles.system.rotation.y + Math.PI / 6,
            duration: config.transitionDuration,
            ease: "power2.inOut"
        });
    }
    
    // Animate camera movement
    gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: config.transitionDuration,
        ease: "power2.inOut",
        onUpdate: function() {
            // Look at center during transition
            if (camera) camera.lookAt(0, 0, 0);
        }
    });
    
    // Reset target rotations if star interactivity is active
    if (typeof targetRotationX !== 'undefined' && typeof targetRotationY !== 'undefined') {
        targetRotationX = 0;
        targetRotationY = 0;
    }
}


function activateSection(section) {
    // Activate the specified section
    document.querySelectorAll('.section').forEach(el => {
        el.classList.remove('active');
    });
    
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    // Update indicators
    updateSectionIndicators(section);
    
    // Show 3D elements for this section
    showSectionElements(section);
}

// ==========================================================================
// 7. Project Modal Implementation
// ==========================================================================
function openProjectModal(projectId) {
    if (!projectModal || !modalContent || isModalOpen) return;

    isModalOpen = true;

    const projectData = {
        isl: {
            title: "Recommendation System",
            description: "A project that implements a recommendation system using various algorithms to provide personalized suggestions.",
            technologies: ["AI/ML", "Python", "Flask"],
            features: [
                "Personalized recommendations based on user preferences",
                "User-friendly interface",
                "Real-time data processing",
                "Integration with multiple data sources"
            ],
            challenges: "Ensuring accurate recommendations across diverse user preferences.",
            outcome: "Improved user engagement by 30% through personalized suggestions.",
            link:"https://github.com/NaveenKitty14/Recommendation-System"
        },
        avatar: {
            title: "Word-pix",
            description: "A web application that converts text to sign language using a 3D avatar.",
            technologies: ["JavaScript", "Three.js", "HTML", "CSS"],
            features: [
                "Text-to-sign conversion",
                "Interactive user interface",
                "Support for multiple languages",
                "Customizable avatar settings"
            ],
            challenges: "Achieving realistic animations and quick response times.",
            outcome: "Successfully translates text into sign language with 95% accuracy.",
            link: "https://github.com/NaveenKitty14/Word-Pix"
        },
        voice: {
            title: "Image Segmentation and Edge Detection",
            description: "An AI-powered tool for image processing that identifies and segments objects within images.",
            technologies: ["AI", "TensorFlow", "Python"],
            features: [
                "Real-time image processing",
                "High accuracy in edge detection",
                "User-friendly interface for input",
                "Supports various image formats"
            ],
            challenges: "Handling diverse image qualities and backgrounds effectively.",
            outcome: "Achieved a segmentation accuracy of 90% on benchmark datasets.",
            link: "https://github.com/NaveenKitty14/Image-Segmentation-Edge-Detection"
        },
        events: {
            title: "Network Intrusion Detection System",
            description: "A system designed to detect unauthorized access in network environments.",
            technologies: ["Security", "Python", "Deep Learning", "GUI"],
            features: [
                "Real-time monitoring",
                "Alerts for suspicious activities",
                "Comprehensive reporting tools",
                "User-friendly dashboard"
            ],
            challenges: "Minimizing false positives while ensuring high detection rates.",
            outcome: "Successfully identified 95% of intrusion attempts in tests.",
            link: ""
        },
        community: {
            title: "Portfolio Website",
            description: "A personal portfolio website showcasing projects, skills, and experiences.",
            technologies: ["Web Development", "HTML", "CSS", "JavaScript"],
            features: [
                "Responsive design",
                "Interactive project showcase",
                "Easy navigation",
                "Contact form integration"
            ],
            challenges: "Designing a visually appealing layout while maintaining functionality.",
            outcome: "Increased visibility and received positive feedback from users.",
            link: "https://naveen-kitty-portfoliocom.vercel.app/"
        },
        voice: {
            title: "UI/UX & Photoshop Project",
            description: "A comprehensive design and development project focused on creating intuitive user interfaces and seamless user experiences across web platforms.",
            technologies: ["Adobe Photoshop", "Figma", "HTML/CSS", "JavaScript", "React"],
            features: [
                "Responsive web design with modern aesthetics",
                "Interactive UI components and animations",
                "User-centered design approach with intuitive navigation",
                "Cross-platform compatibility and optimization"
            ],
            challenges: "Balancing visual appeal with performance optimization while ensuring consistent user experience across multiple devices.",
            outcome: "Delivered a highly rated interface design that increased user engagement by 40% and reduced bounce rate by 25%.",
            link: "https://drive.google.com/drive/folders/1ySgIPT0ex1MTd3WQ9Lwg9J215hCA43lb?usp=sharing"
        }
        ,
       
    };

    const project = projectData[projectId];

    if (!project) {
        console.error("Project data not found for ID:", projectId);
        isModalOpen = false;
        return;
    }

    const modalHTML = `
        <div class="project-modal-header">
            <h2>${project.title}</h2>
        </div>
        <div class="project-modal-body">
            <div class="project-description">
                <p>${project.description}</p>
            </div>
            <div class="project-details">
                <div class="project-technologies">
                    <h3>Technologies Used</h3>
                    <div class="tech-tags">
                        ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                </div>
                <div class="project-features">
                    <h3>Key Features</h3>
                    <ul>
                        ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                <div class="project-challenges-outcome">
                    <div class="project-challenges">
                        <h3>Challenges</h3>
                        <p>${project.challenges}</p>
                    </div>
                    <div class="project-outcome">
                        <h3>Outcome</h3>
                        <p>${project.outcome}</p>
                    </div>
                </div>
                <div class="project-view-button">
                    <a href="${project.link}" target="_blank" class="view-project-button">View Project</a>
                </div>
            </div>
        </div>
    `;

    modalContent.innerHTML = modalHTML;

    gsap.to(projectModal, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.3,
        ease: "power2.inOut"
    });
    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}



function closeProjectModal() {
    if (!projectModal || !isModalOpen) return;
    
    // Hide modal with animation
    gsap.to(projectModal, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
            projectModal.classList.remove('active');
            projectModal.style.visibility = 'hidden';
            
            // Clear modal content after animation
            if (modalContent) {
                modalContent.innerHTML = '';
            }
            
            // Reset flag
            isModalOpen = false;
        }
    });
    
    // Re-enable scrolling
    document.body.style.overflow = '';
}

// ==========================================================================
// 8. Form Handling
// ==========================================================================

function handleFormSubmit(e) {
    if (!e || !contactForm) return;
    
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const formValues = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateForm(formValues)) {
        return;
    }
    
    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (!submitButton) return;
    
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    
    // In a real application, you would send the data to a server
    // For this demo, we'll simulate a successful submission
    setTimeout(() => {
        // Reset form
        contactForm.reset();
        
        // Show success message
        submitButton.innerHTML = '<i class="fas fa-check"></i> Sent!';
        
        // Reset button after delay
        setTimeout(() => {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }, 2000);
    }, 1500);
}

function validateForm(formValues) {
    let isValid = true;
    
    // Basic validation
    if (!formValues.name || formValues.name.trim() === '') {
        showValidationError('name', 'Please enter your name');
        isValid = false;
    }
    
    if (!formValues.email || !isValidEmail(formValues.email)) {
        showValidationError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!formValues.subject || formValues.subject.trim() === '') {
        showValidationError('subject', 'Please enter a subject');
        isValid = false;
    }
    
    if (!formValues.message || formValues.message.trim() === '') {
        showValidationError('message', 'Please enter a message');
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showValidationError(fieldName, message) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    // Add error class
    field.classList.add('error');
    
    // Show error message
    let errorElement = field.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
    } else {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    
    // Clear error after user starts typing
    field.addEventListener('input', function clearError() {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.remove();
        }
        field.removeEventListener('input', clearError);
    });
}

// ==========================================================================
// 9. Audio Setup & Management
// ==========================================================================

function setupAudio() {
    // Create audio element if it doesn't exist yet
    if (!backgroundAudio) {
        backgroundAudio = new Audio('./assets/audio/background.mp3');
        backgroundAudio.loop = true;
        
        // Set properties if audio element exists
        if (backgroundAudio) {
            backgroundAudio.loop = true;
            backgroundAudio.volume = 0.3;
        }
    }
    
    // Update UI to reflect initial audio state
    updateAudioToggleUI();
    
    // Setup autoplay with user interaction to comply with browser policies
    document.addEventListener('click', startAudioOnInteraction);
    document.addEventListener('keydown', startAudioOnInteraction);
}

function startAudioOnInteraction() {
    // Only trigger once
    document.removeEventListener('click', startAudioOnInteraction);
    document.removeEventListener('keydown', startAudioOnInteraction);
    
    // Don't auto-start, just make it ready to play on toggle
    if (audioToggle) {
        audioToggle.disabled = false;
    }
}

function toggleAudio() {
    if (!backgroundAudio || !audioToggle) return;
    
    if (isAudioPlaying) {
        backgroundAudio.pause();
        isAudioPlaying = false;
    } else {
        // Try to play, handle autoplay restrictions
        backgroundAudio.play().catch(e => {
            console.log('Audio playback failed:', e);
        });
        isAudioPlaying = true;
    }
    
    // Update UI
    updateAudioToggleUI();
}

function updateAudioToggleUI() {
    if (!audioToggle) return;
    
    if (isAudioPlaying) {
        audioToggle.classList.remove('muted');
    } else {
        audioToggle.classList.add('muted');
    }
}

// ==========================================================================
// 10. Typing Effect
// ==========================================================================

function setupTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100; // ms per character
    
    function type() {
        // Safety check
        if (!typingElement || !config.typingTexts || config.typingTexts.length === 0) return;
        
        const currentTextObj = config.typingTexts[currentTextIndex];
        const currentText = currentTextObj.text;

        // Change the color of the text dynamically
        typingElement.style.color = currentTextObj.color;

        if (isDeleting) {
            // Deleting text
            typingElement.textContent = currentText.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50; // Faster when deleting
        } else {
            // Typing text
            typingElement.textContent = currentText.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100; // Normal speed when typing
        }
        
        // Handle completion and cycling
        if (!isDeleting && currentCharIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 1000; // Wait before deleting
        } else if (isDeleting && currentCharIndex === 0) {
            isDeleting = false;
            currentTextIndex = (currentTextIndex + 1) % config.typingTexts.length;
            typingSpeed = 500; // Wait before typing the next text
        }
        
        setTimeout(type, typingSpeed);
    }
    
    // Start the typing effect
    setTimeout(type, 1000);
}

// Call the function to initiate the typing effect
setupTypingEffect();

// ==========================================================================
// 11. Navigation Helpers
// ==========================================================================

function handleScroll(e) {
    // Skip if transitioning or modal is open
    if (isTransitioning || isModalOpen) return;
    
    // Prevent default scroll behavior
    e.preventDefault();
    
    // Determine scroll direction
    const direction = e.deltaY > 0 ? 1 : -1;
    
    // Get section order
    const sectionOrder = Array.from(sections).map(section => section.id);
    const currentIndex = sectionOrder.indexOf(currentSection);
    
    // Calculate target section
    let targetIndex = currentIndex + direction;
    
    // Ensure target index is within bounds
    if (targetIndex >= 0 && targetIndex < sectionOrder.length) {
        navigateToSection(sectionOrder[targetIndex]);
    }
}

function handleKeyNavigation(e) {
    // Skip if transitioning or modal is open
    if (isTransitioning || isModalOpen) return;
    
    // Get section order
    const sectionOrder = Array.from(sections).map(section => section.id);
    const currentIndex = sectionOrder.indexOf(currentSection);
    
    let targetIndex = currentIndex;
    
    // Handle arrow keys and Page Up/Down
    switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
            targetIndex++;
            break;
        case 'ArrowUp':
        case 'PageUp':
            targetIndex--;
            break;
        case 'Home':
            targetIndex = 0;
            break;
        case 'End':
            targetIndex = sectionOrder.length - 1;
            break;
        case 'Escape':
            if (isModalOpen) {
                closeProjectModal();
            }
            break;
        default:
            return; // Exit for other keys
    }
    
    // Ensure target index is within bounds
    if (targetIndex >= 0 && targetIndex < sectionOrder.length && targetIndex !== currentIndex) {
        navigateToSection(sectionOrder[targetIndex]);
    }
}

function setupStarInteractivity() {
    // Target rotation values
    let targetRotationX = 0;
    let targetRotationY = 0;
    
    // Determine sensitivity based on device type
    const interactionSensitivity = isMobile ? 0.05 : 0.08;
    
    // Last time the mousemove handler ran
    let lastUpdate = 0;
    // Throttle interval in ms
    const throttleInterval = 50;
    
    // Set up throttled mouse move handler
    document.addEventListener('mousemove', (event) => {
        // Throttle the event handling
        const now = Date.now();
        if (now - lastUpdate < throttleInterval) return;
        lastUpdate = now;
        
        if (!particles || !particles.system) return;
        
        // Convert mouse position to normalized coordinates (-1 to 1)
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update target rotation with device-appropriate sensitivity
        targetRotationX = mouseY * interactionSensitivity;
        targetRotationY = mouseX * interactionSensitivity;
    });
    
    // Set up animation loop for smooth rotation
    function updateGalaxyRotation() {
        if (!particles || !particles.system) return;
        
        // Smoothly interpolate current rotation toward target rotation
        // The 0.03 factor controls the smoothness (lower = smoother but slower)
        particles.system.rotation.x += (targetRotationX - particles.system.rotation.x) * 0.03;
        particles.system.rotation.y += (targetRotationY - particles.system.rotation.y) * 0.03;
        
        // Continue animation loop
        requestAnimationFrame(updateGalaxyRotation);
    }
    
    // Start the animation loop
    updateGalaxyRotation();
    
    // Add subtle automatic movement when mouse is idle
    let idleTimeout;
    const resetIdleTimer = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
            // Start gentle swaying motion when idle
            const idleAnimation = () => {
                if (!particles || !particles.system) return;
                
                const time = Date.now() * 0.001;
                targetRotationX = Math.sin(time * 0.15) * 0.04;
                targetRotationY = Math.cos(time * 0.2) * 0.04;
                
                // Check if mouse moved and cancel idle animation if it did
                document.addEventListener('mousemove', cancelIdleAnimation, { once: true });
                
                // Continue idle animation
                idleAnimationFrame = requestAnimationFrame(idleAnimation);
            };
            
            let idleAnimationFrame;
            const cancelIdleAnimation = () => {
                cancelAnimationFrame(idleAnimationFrame);
            };
            
            // Start idle animation
            idleAnimation();
        }, 5000); // Start idle animation after 5 seconds of no mouse movement
    };
    
    // Reset idle timer on mouse movement
    document.addEventListener('mousemove', resetIdleTimer);
    resetIdleTimer(); // Initial call
    
    // Add touch support for mobile devices
    document.addEventListener('touchmove', (event) => {
        if (!particles || !particles.system || !event.touches[0]) return;
        
        // Get the first touch point
        const touch = event.touches[0];
        
        // Convert touch position to normalized coordinates (-1 to 1)
        const touchX = (touch.clientX / window.innerWidth) * 2 - 1;
        const touchY = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        // Update target rotation with reduced sensitivity for touch
        targetRotationX = touchY * (interactionSensitivity * 0.7);
        targetRotationY = touchX * (interactionSensitivity * 0.7);
        
        // Prevent scrolling while interacting with the galaxy
        event.preventDefault();
    }, { passive: false });
}

