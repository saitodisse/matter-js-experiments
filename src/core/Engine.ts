/**
 * Engine.ts
 *
 * This file contains the Engine class, which serves as the main wrapper around
 * the Matter.js physics engine. It provides a simplified interface for creating,
 * managing, and interacting with the physics simulation.
 */

import Matter from "matter-js";
import { SimulationInstance, SimulationOptions } from "../types";
// import { GameManager } from "./GameManager"; // Removed as unused TS6133
import { DebugControl } from "../components/DebugControl"; // Added
import { AudioManager } from "./AudioManager"; // Added
/**
 * Engine Class
 *
 * A wrapper around the Matter.js physics engine that provides methods for:
 * - Creating and managing the physics simulation
 * - Adding and removing bodies from the simulation
 * - Starting and stopping the simulation
 * - Accessing various components of the simulation
 */
export class Engine {
    // Core Matter.js components
    private engine: Matter.Engine; // The physics engine
    private world: Matter.World; // The physics world (container for all bodies)
    private render: Matter.Render; // The renderer for visualizing the simulation
    private runner: Matter.Runner; // The runner for updating the simulation

    // Mouse interaction components
    // private mouse: Matter.Mouse; // Removed as unused TS2564
    // private mouseConstraint: Matter.MouseConstraint; // Removed as unused TS2564

    // Optional components
    private debugControl?: DebugControl; // Added
    private audioManager?: AudioManager; // Added

    /**
     * Engine constructor
     *
     * @param options - Configuration options for the simulation
     */
    constructor(options: SimulationOptions & { audioManager?: AudioManager }) { // Added audioManager to options
        // Create the Matter.js physics engine
        this.engine = Matter.Engine.create();
        // Get a reference to the world (container for all bodies)
        this.world = this.engine.world;

        // Store optional components
        this.audioManager = options.audioManager; // Added

        // Calculate the device pixel ratio for sharp rendering
        const pixelRatio = window.devicePixelRatio || 1;

        // Create the renderer for visualizing the simulation
        this.render = Matter.Render.create({
            element: options.element, // DOM element to attach the renderer to
            engine: this.engine, // The physics engine to render
            options: {
                width: options.width, // Width of the canvas
                height: options.height, // Height of the canvas
                showAngleIndicator: options.showAngleIndicator || false, // Show rotation indicators
                background: options.background || "#F0F0F0", // Background color
                wireframes: options.wireframes || false, // Wireframe rendering mode
                pixelRatio: pixelRatio, // Use device pixel ratio for sharp rendering
                hasBounds: true, // Enable bounds for better rendering control
            },
        });

        // Create the runner for updating the simulation
        this.runner = Matter.Runner.create();

        // Setup collision event listener
        this.setupCollisionListener();
    }

    /**
     * Sets the DebugControl instance for logging.
     * @param debugControl - The DebugControl instance.
     */
    public setDebugControl(debugControl: DebugControl): void { // Added method
        this.debugControl = debugControl;
    }

    /**
     * Starts the physics simulation
     *
     * This method starts both the renderer and the physics runner,
     * which begins the animation and physics calculations.
     */
    public start(): void {
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
    }

    /**
     * Stops the physics simulation
     *
     * This method stops both the renderer and the physics runner,
     * which pauses the animation and physics calculations.
     */
    public stop(): void {
        Matter.Render.stop(this.render);
        Matter.Runner.stop(this.runner);
    }

    /**
     * Adds a body or array of bodies to the physics world
     *
     * @param body - A single physics body or array of bodies to add
     */
    public addBody(body: Matter.Body | Matter.Body[]): void {
        Matter.Composite.add(this.world, body);
    }

    /**
     * Removes a body from the physics world
     *
     * @param body - The physics body to remove
     */
    public removeBody(body: Matter.Body): void {
        Matter.Composite.remove(this.world, body);
    }

    /**
     * Gets all bodies currently in the physics world
     *
     * @returns Array of all bodies in the world
     */
    public getAllBodies(): Matter.Body[] {
        return Matter.Composite.allBodies(this.world);
    }

    /**
     * Adjusts the renderer's viewport to focus on a specific area
     *
     * @param bounds - The bounds to focus on, defined by min and max points
     */
    public lookAt(
        bounds: {
            min: { x: number; y: number };
            max: { x: number; y: number };
        },
    ): void {
        Matter.Render.lookAt(this.render, bounds);
    }

    /**
     * Gets the Matter.js engine instance
     *
     * @returns The Matter.js engine instance
     */
    public getEngine(): Matter.Engine {
        return this.engine;
    }

    /**
     * Gets the Matter.js world instance
     *
     * @returns The Matter.js world instance
     */
    public getWorld(): Matter.World {
        return this.world;
    }

    /**
     * Gets the Matter.js renderer instance
     *
     * @returns The Matter.js renderer instance
     */
    public getRender(): Matter.Render {
        return this.render;
    }

    /**
     * Gets the Matter.js runner instance
     *
     * @returns The Matter.js runner instance
     */
    public getRunner(): Matter.Runner {
        return this.runner;
    }

    /**
     * Gets the canvas element used by the renderer
     *
     * @returns The HTML canvas element
     */
    public getCanvas(): HTMLCanvasElement {
        return this.render.canvas;
    }

    // Removed getMouse() and getMouseConstraint() as properties were removed
    /**
     * Gets a simplified object containing the main simulation components
     *
     * This is useful for passing to other components that need access
     * to multiple parts of the simulation.
     *
     * @returns Object containing the main simulation components
     */
    public getInstance(): SimulationInstance {
        return {
            engine: this.engine,
            runner: this.runner,
            render: this.render,
            canvas: this.render.canvas,
            stop: this.stop.bind(this),
        };
    }

    /**
     * Sets up the collision event listener for the physics engine.
     * Plays a sound when bodies collide, with volume based on impact velocity.
     */
    private setupCollisionListener(): void {
        // Removed: const audioManager = GameManager.getInstance().getAudioManager();

        Matter.Events.on(this.engine, "collisionStart", (event) => {
            event.pairs.forEach((pair) => {
                // Check if the collision involves at least one non-static body
                // This prevents sounds for static-static interactions if any existed
                if (pair.bodyA.isStatic && pair.bodyB.isStatic) {
                    return; // Skip if both are static
                }

                // Calculate relative velocity magnitude
                const relativeVelocity = Matter.Vector.sub(
                    pair.bodyA.velocity,
                    pair.bodyB.velocity,
                );
                const impactSpeed = Matter.Vector.magnitude(relativeVelocity);

                // Map impact speed to volume (adjust scaling factor and min/max as needed)
                const maxSpeedForFullVolume = 15; // Example speed threshold for max volume
                const minVolume = 0.1;
                const maxVolume = 1.0;
                const volume = Math.max(
                    minVolume,
                    Math.min(maxVolume, impactSpeed / maxSpeedForFullVolume),
                );

                // Play the sound
                // Play the sound if audioManager exists and volume is sufficient
                if (this.audioManager && volume > minVolume + 0.05) { // Changed to this.audioManager
                    this.audioManager.playSound("plop_01", volume); // Changed to this.audioManager
                    // Log the collision event if debugControl exists
                    this.debugControl?.logEvent("Collision", { // Added debug log
                        speed: impactSpeed.toFixed(2),
                        volume: volume.toFixed(2),
                    });
                }
            });
        });
    }
}
