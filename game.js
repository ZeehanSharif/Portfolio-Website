const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; // Set your canvas width
canvas.height = 600; // Set your canvas height

let score = 0;
let lives = 3;
const bulletsPool = []; // Object pool for bullets
const playerBullets = [];
const enemyShips = [];
const enemyBullets = [];
const powerUps = [];
let lastEnemySpawn = Date.now();
let enemySpawnInterval = 2000;
let powerUpEffect = null;
let powerUpEndTime = 0;

function drawScoreboard() {
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, canvas.width - 10, 30);
    ctx.fillText(`Lives: ${lives}`, canvas.width - 10, 50);
}

// Background
const stars = Array(100).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.5
}));

function updateBackground() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.x = Math.random() * canvas.width;
            star.y = 0;
        }
    });
}

function drawBackground() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    update() {}
    draw() {}
}

class Ship extends GameObject {
    constructor(x, y) {
        super(x, y);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}

class PlayerShip extends Ship {
    constructor() {
        super(canvas.width / 2, canvas.height - 50);
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 20, this.y + 30);
        ctx.lineTo(this.x + 20, this.y + 30);
        ctx.closePath();
        ctx.fill();
    }
}

class EnemyShip extends Ship {
    constructor(x) {
        super(x, -30);
    }

    update() {
        this.y += 1; // Basic downward movement
        // Randomly shoot bullets
        if (Math.random() < 0.01) {
            let bullet = getBullet(this.x + 10, this.y + 30, 4); // Adjust bullet starting position and speed
            enemyBullets.push(bullet);
        }
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 15, 15, 0, Math.PI * 2); // Simple circular enemy
        ctx.fill();
    }
}

class Bullet extends GameObject {
    constructor(x, y, velocity) {
        super(x, y);
        this.velocity = velocity;
        this.active = true;
    }

    update() {
        this.y += this.velocity;
        if (this.y < 0 || this.y > canvas.height) {
            this.active = false; // Deactivate bullet when it goes off-screen
        }
    }

    draw() {
        if (!this.active) return;
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); // Simple circular bullet
        ctx.fill();
    }
}

class PowerUp extends GameObject {
    constructor(x, type) {
        super(x, -20);
        this.type = type;
    }

    update() {
        this.y += 1; // Power-ups fall from the top
    }

    draw() {
        ctx.fillStyle = this.type === 'speed' ? 'cyan' : 'magenta';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2); // Simple circular power-up
        ctx.fill();
    }

    apply() {
        powerUpEffect = this.type;
        powerUpEndTime = Date.now() + 10000; // Power-up effect lasts for 10 seconds
    }
}

// Object Pooling for Bullets
function getBullet(x, y, velocity) {
    let bullet = bulletsPool.find(b => !b.active);
    if (bullet) {
        bullet.x = x;
        bullet.y = y;
        bullet.velocity = velocity;
        bullet.active = true;
    } else {
        bullet = new Bullet(x, y, velocity);
        bulletsPool.push(bullet);
    }
    return bullet;
}

const player = new PlayerShip();

function spawnEnemies() {
    if (Date.now() - lastEnemySpawn > enemySpawnInterval) {
        enemyShips.push(new EnemyShip(Math.random() * (canvas.width - 20)));
        lastEnemySpawn = Date.now();
    }
}

function spawnPowerUps() {
    if (Math.random() < 0.005 && !powerUpEffect) { // Small chance to spawn a power-up if none is active
        powerUps.push(new PowerUp(Math.random() * canvas.width, Math.random() < 0.5 ? 'speed' : 'firepower'));
    }
}

function checkCollisions() {
    // Check collisions between player bullets and enemies
    playerBullets.forEach(bullet => {
        enemyShips.forEach((enemy, index) => {
            if (Math.abs(bullet.x - enemy.x) < 15 && Math.abs(bullet.y - enemy.y) < 15) {
                enemyShips.splice(index, 1); // Remove enemy
                bullet.active = false; // Deactivate bullet
                score += 100;
            }
        });
    });

    // Check collisions between player and power-ups
    powerUps.forEach((powerUp, index) => {
        if (Math.abs(powerUp.x - player.x) < 20 && Math.abs(powerUp.y - player.y) < 30) {
            powerUps.splice(index, 1); // Remove power-up
            powerUp.apply();
        }
    });

    // Check collisions between enemy bullets and player
    enemyBullets.forEach(bullet => {
        if (Math.abs(bullet.x - player.x) < 20 && Math.abs(bullet.y - player.y) < 30) {
            bullet.active = false; // Deactivate bullet
            lives -= 1;
            if (lives <= 0) {
                alert('Game Over! Your score: ' + score);
                document.location.reload();
            }
        }
    });

    // Clean up inactive bullets
    cleanupBullets();
}

function cleanupBullets() {
    const isActive = bullet => bullet.active;
    playerBullets.forEach((bullet, index) => {
        if (!isActive(bullet)) playerBullets.splice(index, 1);
    });
    enemyBullets.forEach((bullet, index) => {
        if (!isActive(bullet)) enemyBullets.splice(index, 1);
    });
}

function updateGameObjects() {
    if (powerUpEndTime && Date.now() > powerUpEndTime) {
        powerUpEffect = null;
    }

    playerBullets.forEach(bullet => bullet.update());
    enemyBullets.forEach(bullet => bullet.update());
    enemyShips.forEach(enemy => enemy.update());
    powerUps.forEach(powerUp => powerUp.update());
}

function drawGameObjects() {
    player.draw();
    playerBullets.forEach(bullet => bullet.draw());
    enemyShips.forEach(enemy => enemy.draw());
    enemyBullets.forEach(bullet => bullet.draw());
    powerUps.forEach(powerUp => powerUp.draw());
}

function gameLoop() {
    updateBackground();
    drawBackground();

    spawnEnemies();
    spawnPowerUps();
    updateGameObjects();
    checkCollisions();
    drawGameObjects();

    drawScoreboard(); // Draw the scoreboard on each frame

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', function(event) {
    const speed = powerUpEffect === 'speed' ? 10 : 5; // Set the movement speed of the player ship
    switch (event.key) {
        case ' ':
            playerBullets.push(getBullet(player.x, player.y, -10)); // Player bullet goes upwards
        case 'ArrowLeft':
            // Move left
            player.move(-speed, 0);
            break;
        case 'ArrowRight':
            // Move right
            player.move(speed, 0);
            break;
        case 'ArrowUp':
            // Move up (optional)
            player.move(0, -speed);
            break;
        case 'ArrowDown':
            // Move down (optional)
            player.move(0, speed);
            break;
    }
});


gameLoop();
