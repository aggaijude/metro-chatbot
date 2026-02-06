const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let particleCount; // Defined based on screen size

// Configuration
const connectionDistance = 120;
const mouseDistance = 200;
const baseSpeed = 0.5;

// Resize handling
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Adjust particle count for density
    if (width < 768) {
        particleCount = 40; // Mobile
    } else {
        particleCount = 100; // Desktop
    }

    initParticles();
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * baseSpeed;
        this.vy = (Math.random() - 0.5) * baseSpeed;
        this.size = Math.random() * 2 + 1;
        this.color = `rgba(0, 210, 255, ${Math.random() * 0.5 + 0.2})`; // Cyan/Blueish
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw lines
    connectParticles();

    requestAnimationFrame(animate);
}

function connectParticles() {
    const isLight = document.body.classList.contains('light-theme');
    const r = isLight ? 50 : 0;
    const g = isLight ? 50 : 210;
    const b = isLight ? 50 : 255;

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                const opacity = 1 - (distance / connectionDistance);
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Initial setup
window.addEventListener('resize', resize);
resize();

// Theme handling
function getThemeColors() {
    const isLight = document.body.classList.contains('light-theme');
    return {
        particle: isLight ? `rgba(50, 50, 50, ${Math.random() * 0.5 + 0.1})` : `rgba(0, 210, 255, ${Math.random() * 0.5 + 0.2})`, // Dark grey for light mode, Cyan for dark
        line: isLight ? 'rgba(0, 0, 0,' : 'rgba(0, 210, 255,'
    };
}

// Update particle colors when theme changes
window.addEventListener('themeChanged', () => {
    const colors = getThemeColors();
    particles.forEach(p => {
        p.color = colors.particle.replace(/rgba\(.*?,/, `rgba(${document.body.classList.contains('light-theme') ? '50, 50, 50,' : '0, 210, 255,'}`);
        // Re-randomize opacity slightly for effect
        p.color = document.body.classList.contains('light-theme')
            ? `rgba(50, 50, 50, ${Math.random() * 0.4 + 0.1})`
            : `rgba(0, 210, 255, ${Math.random() * 0.5 + 0.2})`;
    });
});

animate();
