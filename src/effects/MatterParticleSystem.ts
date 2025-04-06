import Matter from "matter-js";
import { Engine } from "../core/Engine"; // Assuming Engine class provides access to Matter.Engine
import { CATEGORY_EFFECT_PARTICLE, CATEGORY_WALL } from "../types";

interface ParticleInfo {
    body: Matter.Body;
    expiryTime: number;
}

export class MatterParticleSystem {
    private matterEngine: Matter.Engine;
    private world: Matter.World;
    private particles: ParticleInfo[] = [];
    private readonly PARTICLE_LIFESPAN_MS = 3000; // 3 seconds
    private readonly PARTICLE_RADIUS = 2;
    private readonly PARTICLE_OPTIONS: Matter.IBodyDefinition = {
        restitution: 0.4,
        friction: 0.6,
        frictionAir: 0.05, // Add some air friction
        collisionFilter: {
            category: CATEGORY_EFFECT_PARTICLE,
            mask: CATEGORY_WALL, // Only collide with walls
        },
        render: {
            fillStyle: "#FFA500", // Orange color for particles
            strokeStyle: "#AF7500",
            lineWidth: 1,
        },
    };

    constructor(engine: Engine) {
        this.matterEngine = engine.getEngine();
        this.world = this.matterEngine.world;
    }

    /**
     * Creates a particle explosion effect using Matter.js bodies.
     * @param position The center position {x, y} of the explosion.
     * @param direction The primary direction vector {x, y} for the explosion (e.g., collision normal).
     * @param force A multiplier for the explosion's intensity (affects count and speed).
     */
    createPocketExplosion(
        position: Matter.Vector,
        direction: Matter.Vector,
        force: number,
    ) {
        const particleCount = Math.floor(5 + force * 10); // Adjust count based on force
        const baseSpeed = 0.5 + force * 0.5; // Adjust speed based on force
        const expiryTime = this.matterEngine.timing.timestamp +
            this.PARTICLE_LIFESPAN_MS;

        // Normalize the primary direction
        const normalizedDirection = Matter.Vector.normalise(direction);

        for (let i = 0; i < particleCount; i++) {
            // Create a small variation angle from the main direction
            const angleOffset = (Math.random() - 0.5) * Math.PI * 0.5; // Spread within ~90 degrees
            const particleDirection = Matter.Vector.rotate(
                normalizedDirection,
                angleOffset,
            );

            // Vary speed slightly
            const speed = baseSpeed * (0.8 + Math.random() * 0.4);
            const velocity = Matter.Vector.mult(particleDirection, speed);

            // Create the particle body slightly offset from the center
            const spawnOffset = Matter.Vector.mult(
                particleDirection,
                this.PARTICLE_RADIUS * 2,
            );
            const spawnPosition = Matter.Vector.add(position, spawnOffset);

            const particleBody = Matter.Bodies.circle(
                spawnPosition.x,
                spawnPosition.y,
                this.PARTICLE_RADIUS,
                this.PARTICLE_OPTIONS,
            );

            // Apply initial velocity
            Matter.Body.setVelocity(particleBody, velocity);

            // Add to world and track
            Matter.Composite.add(this.world, particleBody);
            this.particles.push({ body: particleBody, expiryTime });
        }
    }

    /**
     * Updates the particle system, removing expired particles.
     * Should be called in the main game loop (e.g., beforeUpdate).
     */
    update() {
        const currentTime = this.matterEngine.timing.timestamp;

        // Iterate backwards for safe removal
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particleInfo = this.particles[i];
            if (currentTime >= particleInfo.expiryTime) {
                // Remove from world and tracking array
                Matter.Composite.remove(this.world, particleInfo.body);
                this.particles.splice(i, 1);
            }
        }
    }
}
