import { Particle } from "./Particle";

export class ParticleSystem {
    private particles: Particle[] = [];
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Creates a particle explosion effect at the specified coordinates.
     * @param x The x-coordinate of the explosion center.
     * @param y The y-coordinate of the explosion center.
     * @param force A value (e.g., 1-10) influencing the explosion's intensity.
     */
    createExplosion(x: number, y: number, force: number) {
        const particleCount = Math.floor(10 + force * 10); // More force = more particles
        const baseSpeed = 1 + force * 0.5; // More force = higher base speed
        const baseLife = 700 + force * 50; // More force = slightly longer life
        const baseSize = 1 + force * 0.2; // More force = slightly larger base size

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = baseSpeed * (0.5 + Math.random() * 1.5); // Vary speed
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = baseSize * (0.8 + Math.random() * 0.4); // Vary size
            const life = baseLife * (0.7 + Math.random() * 0.6); // Vary lifespan

            // Color gradient based on force (e.g., yellow to white)
            const intensity = Math.min(1, force / 10); // Normalize force for color
            const r = 255;
            const g = Math.floor(122 * (1 - intensity)); // Start orange (255, 124, 0)
            const b = Math.floor(122 * (1 - intensity)); // Fade to white (255, 255, 255)
            const color = `rgb(${r}, ${g}, ${b})`;

            this.particles.push(new Particle(x, y, vx, vy, size, color, life));
        }

        // Optional: Add a central glow/flash effect here if desired
        // This could be a larger, short-lived particle or a separate drawing call
    }

    /**
     * Updates all active particles.
     * @param deltaTime Time elapsed since the last frame in milliseconds.
     */
    update(deltaTime: number) {
        // Update backwards to allow removal while iterating
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                // Remove dead particles
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Draws all active particles onto the canvas.
     */
    draw() {
        this.particles.forEach((particle) => particle.draw(this.ctx));
    }
}
