// requestAnimationFrame shim
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Setup canvas and context
var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    cw = window.innerWidth,
    ch = window.innerHeight;

// Fireworks and particles collections
var fireworks = [],
    particles = [],
    hue = 120,
    limiterTotal = 5,
    limiterTick = 0,
    timerTotal = 80,
    timerTick = 0,
    mousedown = false,
    mx,
    my;

canvas.width = cw;
canvas.height = ch;

// Random number in a range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Calculate distance between two points
function calculateDistance(p1x, p1y, p2x, p2y) {
    var xDistance = p1x - p2x,
        yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// Firework class
function Firework(sx, sy, tx, ty) {
    this.x = sx;
    this.y = sy;
    this.sx = sx;
    this.sy = sy;
    this.tx = tx;
    this.ty = ty;
    this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
    this.distanceTraveled = 0;
    this.coordinates = [];
    this.coordinateCount = 3;
    while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.atan2(ty - sy, tx - sx);
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = random(50, 70);
    this.targetRadius = 1;
}
Firework.prototype.update = function(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    if (this.targetRadius < 8) {
        this.targetRadius += 0.3;
    } else {
        this.targetRadius = 1;
    }
    this.speed *= this.acceleration;
    var vx = Math.cos(this.angle) * this.speed,
        vy = Math.sin(this.angle) * this.speed;
    this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);
    if (this.distanceTraveled >= this.distanceToTarget) {
        createParticles(this.tx, this.ty);
        fireworks.splice(index, 1);
    } else {
        this.x += vx;
        this.y += vy;
    }
};
Firework.prototype.draw = function() {
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
    ctx.stroke();
};

// Particle class
function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.coordinates = [];
    this.coordinateCount = 5;
    while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
    }
    this.angle = random(0, Math.PI * 2);
    this.speed = random(1, 10);
    this.friction = 0.95;
    this.gravity = 1;
    this.hue = random(hue - 20, hue + 20);
    this.brightness = random(50, 80);
    this.alpha = 1;
    this.decay = random(0.015, 0.03);
}
Particle.prototype.update = function(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.friction;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    this.alpha -= this.decay;
    if (this.alpha <= this.decay) {
        particles.splice(index, 1);
    }
};
Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
    ctx.stroke();
};

// Create particles group
function createParticles(x, y) {
    var particleCount = 30;
    while (particleCount--) {
        particles.push(new Particle(x, y));
    }
}

// Control variables for drawing the name
var nameTimer = 0;
var nameInterval = 30; // Draw name every 30 frames
var displayName = false; // Only display name after click

// Function to draw the name with a smooth color change
function drawName() {
    if (displayName) {
        ctx.font = 'bold 60px "Segoe UI", Tahoma, Geneva, sans-serif';  // Updated font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var x = cw / 2;
        var y = ch / 2;
        ctx.fillStyle = 'hsla(' + random(0, 360) + ', 100%, 50%, 0.2)';  // Random color
        ctx.fillText("SHARK-51578", x, y);
    }
}


// Main loop
function loop() {
    requestAnimFrame(loop);
    hue += 0.5;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';
    var i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }
    i = particles.length;
    while (i--) {
        particles[i].draw();
        particles[i].update(i);
    }
    if (timerTick >= timerTotal) {
        if (!mousedown) {
            fireworks.push(new Firework(cw / 2, ch, random(0, cw), random(0, ch / 2)));
            timerTick = 0;
        }
    } else {
        timerTick++;
    }
    if (limiterTick >= limiterTotal) {
        if (mousedown) {
            fireworks.push(new Firework(cw / 2, ch, mx, my));
            limiterTick = 0;
        }
    } else {
        limiterTick++;
    }
    drawName();
}

// Mouse events
canvas.addEventListener('mousemove', function(e) {
    mx = e.pageX - canvas.offsetLeft;
    my = e.pageY - canvas.offsetTop;
});
canvas.addEventListener('mousedown', function(e) {
    e.preventDefault();
    mousedown = true;
    displayName = true; // Start displaying the name after click
});
canvas.addEventListener('mouseup', function(e) {
    e.preventDefault();
    mousedown = false;
});

window.onload = loop;
