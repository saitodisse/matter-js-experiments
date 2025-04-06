import Matter from "matter-js";
import { BodyFactory } from "../components/BodyFactory";
import { BoundaryBox } from "../components/BoundaryBox";
import { BoundaryWalls } from "../components/BoundaryWalls";
import { DebugControl } from "../components/DebugControl";
import { InitialShapes } from "../components/InitialShapes";
import { InputHandler } from "../components/InputHandler";
import { Engine } from "./Engine";
import { GameManager } from "./GameManager";
import { ParticleSystem } from "../effects/ParticleSystem"; // Keep for now, might be used elsewhere
import { MatterParticleSystem } from "../effects/MatterParticleSystem"; // Import new system
import { BodyWrapper } from "../utils/BodyWrapper";

/**
 * BallPoolSimulation Class
 *
 * The main class that orchestrates the entire physics simulation.
 * It initializes all components, sets up the environment, and manages
 * the simulation lifecycle.
 */
export class BallPoolSimulation {
    private engine: Engine;
    private debugControl: DebugControl;
    private bodyFactory: BodyFactory;
    private bodyWrapper: BodyWrapper;
    private gameManager: GameManager;
    private particleSystem: ParticleSystem; // Visual-only particles
    private matterParticleSystem: MatterParticleSystem; // Physics-based particles

    //
    // private boundaryWalls!: BoundaryWalls; // Removed as unused TS6133
    private boundaryBox!: BoundaryBox;
    // private initialShapes!: InitialShapes; // Removed as unused TS6133
    private inputHandler: InputHandler;
    /**
     * BallPoolSimulation constructor
     *
     * Initializes all components of the simulation and sets up the environment.
     */
    constructor() {
        // Initialize the game manager (singleton) - Needs to happen before Engine if Engine needs AudioManager
        this.gameManager = GameManager.getInstance();

        // Create the physics engine with renderer, passing the AudioManager instance
        this.engine = new Engine({
            element: document.body, // Attach to document body
            width: window.innerWidth, // Full window width
            height: window.innerHeight, // Full window height
            showAngleIndicator: false, // Hide angle indicators by default
            background: "#F0F0F0", // Light gray background
            wireframes: false, // Solid rendering (not wireframe)
            audioManager: this.gameManager.getAudioManager(), // Pass AudioManager
        });

        // Create debug control for toggling debug features
        this.debugControl = new DebugControl(
            this.engine.getEngine(),
            this.engine.getRender(),
        );

        // Create body factory for generating physics bodies
        this.bodyFactory = new BodyFactory(this.debugControl);

        // Set engine reference in game manager
        this.gameManager.setEngine(this.engine);

        // Set DebugControl instance in GameManager (which will also set it in AudioManager)
        this.gameManager.setDebugControl(this.debugControl);

        // Set DebugControl instance in Engine
        this.engine.setDebugControl(this.debugControl);

        // Set restart callback in game manager
        this.gameManager.setRestartCallback(() => this.startGame());
        // Note: BoundaryWalls, BoundaryBox, InitialShapes, and countAndSetInitialBodies
        // are now created/called within restartGame()
        // Create input handler to manage user interactions
        this.inputHandler = new InputHandler(
            this.engine,
            this.bodyFactory,
            this.debugControl,
        );

        // Create body wrapper for screen wrapping effect
        // Note: The bounds extend beyond the screen to ensure smooth wrapping
        this.bodyWrapper = new BodyWrapper({
            min: { x: -100, y: 0 }, // Extend left boundary
            max: { x: window.innerWidth + 100, y: window.innerHeight }, // Extend right boundary
        });

        // Initialize Particle System
        this.particleSystem = new ParticleSystem(
            this.engine.getRender().context,
        );
        // Initialize Matter Particle System
        this.matterParticleSystem = new MatterParticleSystem(this.engine);

        // Pass ParticleSystem to InputHandler (if still needed)
        this.inputHandler.setParticleSystem(this.particleSystem); // Assuming InputHandler still uses the visual one

        // Set up the screen wrapping functionality
        this.setupBodyWrapping();

        // Set the viewport to show the entire screen
        this.engine.lookAt({
            min: { x: 0, y: 0 },
            max: { x: window.innerWidth, y: window.innerHeight },
        });

        // Call restartGame initially to set up walls, box, and shapes
        this.startGame();
    }

    /**
     * Initializes all game components
     */

    /**
     * Counts the initial non-static bodies and sets the count in the game manager
     */
    private countAndSetInitialBodies(): void {
        // Get all non-static bodies
        const nonStaticBodies = this.engine
            .getAllBodies()
            .filter((body) => !body.isStatic);

        // Set the initial count in the game manager
        this.gameManager.setInitialBodyCount(nonStaticBodies.length);
    }

    /**
     * Restarts the game by clearing all bodies and reinitializing
     */
    private startGame(): void {
        this.debugControl?.logEvent("GameRestart", {
            message: "Restarting game...",
        });

        // Clear all bodies from the world (except static ones like the outer walls if they existed)
        // It's safer to remove specific bodies if needed, but clearing non-static is typical for restart.
        // Let's clear everything for simplicity, as walls/box are recreated anyway.
        Matter.Composite.clear(this.engine.getWorld(), false); // Keep static property false to remove everything

        // Re-create the boundary walls
        new BoundaryWalls( // Instance not stored as it's unused TS6133
            this.engine,
            window.innerWidth,
            window.innerHeight,
        );

        // Re-create the boundary box
        this.boundaryBox = new BoundaryBox(
            this.engine,
            window.innerWidth,
            window.innerHeight,
            this.debugControl,
            this.matterParticleSystem, // Pass the MatterParticleSystem instance
        );

        // Re-create the initial shapes
        new InitialShapes({ // Instance not stored as it's unused TS6133
            engine: this.engine,
            boundaryBox: this.boundaryBox,
            bodyFactory: this.bodyFactory,
            debugControl: this.debugControl,
        }); // Pass boundaryBox

        // Count and set the initial bodies again
        this.countAndSetInitialBodies();
    }

    /**
     * Sets up the screen wrapping functionality for all bodies
     *
     * This method adds an event listener to the physics engine that
     * wraps bodies around the screen edges before each physics update,
     * and updates the particle system.
     */
    private setupBodyWrapping(): void {
        // Add event listener to the 'beforeUpdate' event
        let lastTimestamp = 0;
        Matter.Events.on(this.engine.getEngine(), "beforeUpdate", (event) => {
            // Calculate deltaTime
            const currentTimestamp = event.timestamp;
            const deltaTime = currentTimestamp -
                (lastTimestamp || currentTimestamp); // Handle first frame
            lastTimestamp = currentTimestamp;

            // Update Visual Particle System
            this.particleSystem.update(deltaTime);
            // Update Matter Particle System
            this.matterParticleSystem.update(); // Uses internal engine timestamp

            // Get all bodies in the simulation
            const allBodies = this.engine.getAllBodies();
            // Apply wrapping to each body
            for (const body of allBodies) {
                this.bodyWrapper.wrapBody(body);
            }
        });

        // Add event listener for drawing particles after rendering
        Matter.Events.on(this.engine.getRender(), "afterRender", () => {
            this.particleSystem.draw();
        });
    }

    /**
     * Starts the physics simulation
     *
     * This method starts both the renderer and the physics engine.
     */
    public start(): void {
        this.engine.start(); // This starts the Runner and Render loop
    }

    /**
     * Stops the physics simulation
     *
     * This method stops both the renderer and the physics engine.
     */
    public stop(): void {
        this.engine.stop();
    }
}
