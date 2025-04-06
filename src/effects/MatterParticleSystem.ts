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
    private readonly PARTICLE_BASE_LIFESPAN_MS = 3000; // Base lifespan 3 seconds
    private readonly PARTICLE_BASE_RADIUS = 2; // Base radius
    private readonly FIRE_COLORS = ["#FF0000", "#FFA500", "#FFFF00"]; // Red, Orange, Yellow
    private readonly BASE_PARTICLE_PHYSICS_OPTIONS: Matter.IBodyDefinition = {
        restitution: 0.4,
        friction: 0.6,
        frictionAir: 0.05,
        collisionFilter: {
            category: CATEGORY_EFFECT_PARTICLE,
            mask: CATEGORY_WALL, // Only collide with walls
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
        const baseSpeed = 8.0 + force * 2; // Increased base speed and force multiplier for stronger effect
        const baseTimestamp = this.matterEngine.timing.timestamp; // Define baseTimestamp here
        // Remove the old fixed expiryTime calculation

        // Normalize the primary direction
        const normalizedDirection = Matter.Vector.normalise(direction);

        for (let i = 0; i < particleCount; i++) {
            // Create a small variation angle from the main direction
            const angleOffset = (Math.random() - 0.5) * Math.PI * 0.5; // Spread within ~90 degrees
            const particleDirection = Matter.Vector.rotate(
                normalizedDirection,
                angleOffset,
            );

            // Vary speed
            const speed = baseSpeed * (0.8 + Math.random() * 0.4);
            const velocity = Matter.Vector.mult(particleDirection, speed);

            // Vary size
            const radius = this.PARTICLE_BASE_RADIUS *
                (0.7 + Math.random() * 0.6);

            // Vary color
            const color = Matter.Common.choose(this.FIRE_COLORS);

            // Vary lifespan
            const lifespan = this.PARTICLE_BASE_LIFESPAN_MS *
                (0.8 + Math.random() * 0.4);
            const expiryTime = baseTimestamp + lifespan; // Now baseTimestamp is defined

            // Create the particle body slightly offset from the center
            const spawnOffset = Matter.Vector.mult(
                particleDirection,
                radius * 2,
            ); // Use variable radius
            const spawnPosition = Matter.Vector.add(position, spawnOffset);

            // Combine base physics options with specific render/size options
            const particleOptions: Matter.IBodyDefinition = {
                ...this.BASE_PARTICLE_PHYSICS_OPTIONS,
                render: {
                    fillStyle: color,
                    // Optional: derive strokeStyle or keep it simple
                    strokeStyle: "#000", // Use black border instead of non-existent shadeColor
                    lineWidth: 1,
                },
            };

            const particleBody = Matter.Bodies.circle(
                spawnPosition.x,
                spawnPosition.y,
                radius, // Use variable radius
                particleOptions,
            );

            // Apply initial velocity
            Matter.Body.setVelocity(particleBody, velocity);

            // Add to world and track with its specific expiry time
            Matter.Composite.add(this.world, particleBody);
            this.particles.push({ body: particleBody, expiryTime: expiryTime }); // Use variable expiryTime
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
