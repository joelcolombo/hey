// Interactive Billiards - Top View
// Created by: Joel Colombo ✦ Designer
// Website: joelcolombo.co
// Credits: Three.js, Cannon.js, GSAP

console.log('Script starting...');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x777777); // Yellow background

// Top-down orthographic camera for 2D view
const aspect = window.innerWidth / window.innerHeight;
const viewSize = 15;
const camera = new THREE.OrthographicCamera(
    -viewSize * aspect, viewSize * aspect,
    viewSize, -viewSize,
    0.1, 1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable high quality texture rendering
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
console.log('Max anisotropy:', maxAnisotropy);

document.getElementById('container').appendChild(renderer.domElement);

console.log('Renderer created');

// Physics world with realistic billiards settings
const world = new CANNON.World();
world.gravity.set(0, 0, 0); // No gravity - pure 2D physics

// Create materials for realistic physics
const tableMaterial = new CANNON.Material('table');
const ballMaterial = new CANNON.Material('ball');

// Ball-Table contact material with very high friction (no sliding - pure rolling)
const ballTableContact = new CANNON.ContactMaterial(ballMaterial, tableMaterial, {
    friction: 2.0, // Very high friction - no sliding at all
    restitution: 0.85, // Good bounce
    contactEquationStiffness: 1e9, // Very stiff contact for no deformation
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e9, // Very stiff friction - prevents sliding
    frictionEquationRelaxation: 2
});
world.addContactMaterial(ballTableContact);

// Ball-Ball contact material
const ballBallContact = new CANNON.ContactMaterial(ballMaterial, ballMaterial, {
    friction: 0.05, // Very low friction between balls
    restitution: 0.95, // High bounce for billiards balls
    contactEquationStiffness: 1e9,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRelaxation: 3
});
world.addContactMaterial(ballBallContact);

console.log('Physics world created with realistic materials');

// Lighting for flat appearance
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

// Create boundaries and table surface
function createBoundaries() {
    const wallThickness = 0.01;
    const wallHeight = 0.01;

    // Get viewport bounds - extend to full browser size
    const bounds = {
        left: -viewSize * aspect,
        right: viewSize * aspect,
        top: viewSize,
        bottom: -viewSize
    };

    // No ground plane needed - friction will be simulated through damping

    // Create physics walls with table material
    // Top wall
    const topWall = new CANNON.Body({
        mass: 0,
        material: tableMaterial,
        shape: new CANNON.Box(new CANNON.Vec3(viewSize * aspect, wallHeight, wallThickness))
    });
    topWall.position.set(0, 0, bounds.top);
    world.add(topWall);

    // Bottom wall
    const bottomWall = new CANNON.Body({
        mass: 0,
        material: tableMaterial,
        shape: new CANNON.Box(new CANNON.Vec3(viewSize * aspect, wallHeight, wallThickness))
    });
    bottomWall.position.set(0, 0, bounds.bottom);
    world.add(bottomWall);

    // Left wall
    const leftWall = new CANNON.Body({
        mass: 0,
        material: tableMaterial,
        shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, viewSize))
    });
    leftWall.position.set(bounds.left, 0, 0);
    world.add(leftWall);

    // Right wall
    const rightWall = new CANNON.Body({
        mass: 0,
        material: tableMaterial,
        shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, viewSize))
    });
    rightWall.position.set(bounds.right, 0, 0);
    world.add(rightWall);

    console.log('Boundaries and table surface created with bounds:', bounds);
}

// Create high-quality 8-ball texture with perfect circle
function create8BallTexture(letter) {
    const canvas = document.createElement('canvas');
    // Use 2:1 aspect ratio for spherical UV mapping
    canvas.width = 4096;
    canvas.height = 2048;
    const context = canvas.getContext('2d');

    // Enable better rendering
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Fill with black
    context.fillStyle = '#000000';
    context.fillRect(0, 0, 4096, 2048);

    // Draw white circle in center - adjusted for sphere UV mapping
    const centerX = 2048;
    const centerY = 1024;
    // Smaller circle to account for UV distortion on sphere
    const circleRadius = 380;

    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    context.fill();

    // Draw letter in black with better rendering
    context.fillStyle = '#000000';
    context.font = 'bold 580px Arial Black, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, centerX, centerY + 20);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = maxAnisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
}

// Create 8 billiards balls with proper 8-ball appearance
function createBalls() {
    const balls = [];
    const ballRadius = 3; // Much bigger balls
    const ballMass = 0.17; // Standard billiards ball mass in kg
    const letters = ['H', 'E', 'Y', 'J', 'O', 'E', 'F', 'C'];

    letters.forEach((letter, index) => {
        // Create sphere geometry with higher resolution
        const geometry = new THREE.SphereGeometry(ballRadius, 64, 64);

        // Create 8-ball texture
        const texture = create8BallTexture(letter);

        // Use MeshBasicMaterial for flat shading (no lighting calculations)
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff // White to not tint the texture
        });

        const ball = new THREE.Mesh(geometry, material);

        // Start balls in a small circle to avoid collision explosion
        const angle = (index / letters.length) * Math.PI * 2;
        const startRadius = 0.5; // Small starting radius to keep them close but not overlapping
        const x = Math.cos(angle) * startRadius;
        const z = Math.sin(angle) * startRadius;
        const y = 0;

        ball.position.set(x, y, z);

        // Rotate ball so texture shows correctly from top view
        ball.rotation.x = -Math.PI / 2; // Point the top of the sphere upward

        scene.add(ball);

        // Physics body with realistic billiards ball properties
        const shape = new CANNON.Sphere(ballRadius);
        const body = new CANNON.Body({
            mass: ballMass,
            shape: shape,
            linearDamping: 0.3, // Start with higher damping for initial spread
            angularDamping: 0.3,
            material: ballMaterial // Use shared ball material
        });
        body.position.set(x, y, 0); // Keep at z=0

        // Lock Y position to prevent falling
        body.fixedRotation = false;
        body.updateMassProperties();

        // Give velocity radiating outward from center in all directions
        const speed = 0.3 + Math.random() * 0.2; // Very slow spread: 0.3-0.5
        const vx = Math.cos(angle) * speed;
        const vz = Math.sin(angle) * speed;

        body.velocity.set(vx, 0, vz);

        // Calculate angular velocity for realistic rolling
        // For a sphere rolling without slipping: ω = v / r
        // The axis of rotation is perpendicular to the direction of movement
        body.angularVelocity.set(
            -vz / ballRadius, // Rotation around X axis (for Z movement)
            0,
            vx / ballRadius  // Rotation around Z axis (for X movement)
        );

        world.add(body);

        balls.push({
            mesh: ball,
            body: body,
            radius: ballRadius,
            letter: letter
        });
    });

    console.log('Created', balls.length, 'balls with 8-ball appearance');
    return balls;
}

// Raycasting for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedBall = null;
let isDragging = false;
let dragOffset = new THREE.Vector3(); // Offset from ball center to mouse click point
let dragStartBallPos = new THREE.Vector3(); // Ball position when drag started
let previousBallPos = new THREE.Vector3(); // Previous ball position for velocity calculation

// Convert screen coordinates to world position for orthographic camera
function screenToWorld(screenX, screenY) {
    const x = (screenX / window.innerWidth) * 2 - 1;
    const y = -(screenY / window.innerHeight) * 2 + 1;

    // For orthographic camera, we can directly map normalized device coordinates
    const worldX = x * viewSize * aspect;
    const worldZ = y * viewSize;

    return { x: worldX, z: worldZ };
}

// Mouse interaction
function onMouseDown(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(balls.map(b => b.mesh));

    if (intersects.length > 0) {
        selectedBall = balls.find(b => b.mesh === intersects[0].object);
        isDragging = true;

        if (selectedBall) {
            // Calculate the offset between mouse click and ball center
            const worldPos = screenToWorld(event.clientX, event.clientY);
            dragOffset.set(
                selectedBall.body.position.x - worldPos.x,
                0,
                selectedBall.body.position.z - worldPos.z
            );

            // Store starting position
            dragStartBallPos.copy(selectedBall.body.position);
            previousBallPos.copy(selectedBall.body.position);

            // Stop the ball
            selectedBall.body.velocity.set(0, 0, 0);
            selectedBall.body.angularVelocity.set(0, 0, 0);
        }
    }
}

function onMouseMove(event) {
    event.preventDefault();

    if (isDragging && selectedBall) {
        // Store previous position for velocity calculation
        previousBallPos.copy(selectedBall.body.position);

        // Calculate world position and apply the offset
        const worldPos = screenToWorld(event.clientX, event.clientY);

        // Apply offset so ball stays where you grabbed it
        const targetX = worldPos.x + dragOffset.x;
        const targetZ = worldPos.z + dragOffset.z;

        // Clamp to boundaries to prevent balls from escaping
        const maxX = viewSize * aspect - selectedBall.radius;
        const maxZ = viewSize - selectedBall.radius;

        selectedBall.body.position.x = Math.max(-maxX, Math.min(maxX, targetX));
        selectedBall.body.position.z = Math.max(-maxZ, Math.min(maxZ, targetZ));
        selectedBall.body.position.y = 0; // Keep on the plane
    }
}

function onMouseUp(event) {
    if (isDragging && selectedBall) {
        // Calculate throw velocity based on actual ball movement
        const currentPos = selectedBall.body.position;
        const dx = currentPos.x - previousBallPos.x;
        const dz = currentPos.z - previousBallPos.z;

        // Scale velocity - higher multiplier for more responsive throwing
        const velocityMultiplier = 60; // Increased from 0.1 for better feel
        const vx = dx * velocityMultiplier;
        const vz = dz * velocityMultiplier;

        selectedBall.body.velocity.set(vx, 0, vz);

        // Apply realistic rolling angular velocity
        // The ball should rotate perpendicular to its direction of movement
        selectedBall.body.angularVelocity.set(
            -vz / selectedBall.radius, // Rotation around X axis (for Z movement)
            0,
            vx / selectedBall.radius  // Rotation around Z axis (for X movement)
        );
    }

    isDragging = false;
    selectedBall = null;
}

// Initialize
console.log('Initializing...');
createBoundaries();
const balls = createBalls();

// Set camera position (top-down view)
camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);

console.log('Camera positioned at:', camera.position);

// Event listeners
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);

// Touch events for mobile
renderer.domElement.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        event.clientX = touch.clientX;
        event.clientY = touch.clientY;
        onMouseDown(event);
    }
}, false);

renderer.domElement.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        event.clientX = touch.clientX;
        event.clientY = touch.clientY;
        onMouseMove(event);
    }
}, false);

renderer.domElement.addEventListener('touchend', onMouseUp, false);

// Handle window resize
window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -viewSize * newAspect;
    camera.right = viewSize * newAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
let frameCount = 0;
let lastTime = performance.now();
const fixedTimeStep = 1 / 60;
const maxSubSteps = 3;
let dampingReduced = false;

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Calculate delta time
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Reduce damping after 3 seconds to keep balls moving
    if (!dampingReduced && currentTime > 3000) {
        dampingReduced = true;
        balls.forEach(ball => {
            ball.body.linearDamping = 0.01; // Very low damping - balls keep moving
            ball.body.angularDamping = 0.01;
        });
        console.log('Damping reduced - balls will move longer');
    }

    // Update physics with adaptive timestep for smooth movement
    world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // Update ball positions AND apply realistic rolling physics
    balls.forEach(ball => {
        ball.mesh.position.copy(ball.body.position);

        // Force Y position to stay at 0 (prevent falling)
        ball.body.position.y = 0;
        ball.mesh.position.y = 0;

        // Maintain realistic rolling: sync angular velocity with linear velocity
        const vx = ball.body.velocity.x;
        const vz = ball.body.velocity.z;
        const speed = Math.sqrt(vx * vx + vz * vz);

        // Only apply rolling if the ball is moving
        if (speed > 0.01) {
            // Rolling without slipping: ω = v / r, perpendicular to movement direction
            ball.body.angularVelocity.set(
                -vz / ball.radius,
                0,
                vx / ball.radius
            );
        }

        // Apply rotation: first the base tilt, then the physics rotation
        const baseTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
        const physicsRotation = new THREE.Quaternion().copy(ball.body.quaternion);

        // Multiply in correct order: baseTilt first, then physics rotation
        ball.mesh.quaternion.multiplyQuaternions(baseTilt, physicsRotation);
    });

    // Render
    renderer.render(scene, camera);

    frameCount++;
    if (frameCount === 1) {
        console.log('First frame rendered!');
    }
}

// Start animation
console.log('Starting animation...');
animate();
