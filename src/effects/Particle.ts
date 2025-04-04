export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number; // Remaining lifespan (e.g., in milliseconds)
    initialLife: number;
    alpha: number;

    constructor(
        x: number,
        y: number,
        vx: number,
        vy: number,
        size: number,
        color: string,
        life: number,
    ) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color; // Store base color, alpha calculated separately
        this.life = life;
        this.initialLife = life;
        this.alpha = 1;
    }

    /**
     * Updates the particle's state.
     * @param deltaTime Time elapsed since the last frame in milliseconds.
     * @returns true if the particle is still alive, false otherwise.
     */
    update(deltaTime: number): boolean {
        // Simple physics (could add gravity, friction later)
        this.x += this.vx * (deltaTime / 16.67); // Normalize velocity based on 60fps assumption
        this.y += this.vy * (deltaTime / 16.67);

        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.initialLife); // Linear fade-out

        return this.life > 0; // Return true if particle is still alive
    }

    /**
     * Draws the particle on the canvas.
     * @param ctx The canvas rendering context.
     */
    draw(ctx: CanvasRenderingContext2D) {
        // Extract RGB from the stored color string and apply current alpha
        let r = 255, g = 255, b = 255; // Default white
        const match = this.color.match(/\d+/g);
        if (match && match.length >= 3) {
            r = parseInt(match[0]);
            g = parseInt(match[1]);
            b = parseInt(match[2]);
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
