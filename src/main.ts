/**
 * main.ts
 * 
 * This is the entry point of the application. It creates and initializes the physics
 * simulation, sets up all necessary components, and starts the animation loop.
 */

import "./style.css";
import { Engine } from "./core/Engine";
import { BodyFactory } from "./components/BodyFactory";
import { DebugControl } from "./components/DebugControl";
import { InputHandler } from "./components/InputHandler";
import { BoundaryWalls } from "./components/BoundaryWalls";
import { BoundaryBox } from "./components/BoundaryBox";
import { InitialShapes } from "./components/InitialShapes";
import { BodyWrapper } from "./utils/BodyWrapper";
import { GameManager } from "./core/GameManager";
import Matter from "matter-js";

/**
 * BallPoolSimulation Class
 * 
 * The main class that orchestrates the entire physics simulation.
 * It initializes all components, sets up the environment, and manages
 * the simulation lifecycle.
 */
class BallPoolSimulation {
    // Core components
    private engine: Engine;
    private debugControl: DebugControl;
    private bodyFactory: BodyFactory;
    private bodyWrapper: BodyWrapper;
    private gameManager: GameManager;
    
    // Game components
    private boundaryWalls: BoundaryWalls;
    private boundaryBox: BoundaryBox;
    private initialShapes: InitialShapes;
    private inputHandler: InputHandler;

    /**
     * BallPoolSimulation constructor
     * 
     * Initializes all components of the simulation and sets up the environment.
     */
    constructor() {
        // Initialize the game
        this.initializeGame();
    }
    
    /**
     * Initializes all game components
     */
    private initializeGame(): void {
        // Create the physics engine with renderer
        this.engine = new Engine({
            element: document.body,          // Attach to document body
            width: window.innerWidth,        // Full window width
            height: window.innerHeight,      // Full window height
            showAngleIndicator: false,       // Hide angle indicators by default
            background: "#F0F0F0",           // Light gray background
            wireframes: false,               // Solid rendering (not wireframe)
        });

        // Create debug control for toggling debug features
        this.debugControl = new DebugControl(
            this.engine.getEngine(),
            this.engine.getRender(),
        );

        // Create body factory for generating physics bodies
        this.bodyFactory = new BodyFactory(this.debugControl);

        // Initialize the game manager (singleton)
        this.gameManager = GameManager.getInstance();
        
        // Set engine reference in game manager
        this.gameManager.setEngine(this.engine);
        
        // Set restart callback in game manager
        this.gameManager.setRestartCallback(() => this.restartGame());

        // Create boundary walls around the entire screen
        this.boundaryWalls = new BoundaryWalls(
            this.engine,
            window.innerWidth,
            window.innerHeight,
        );

        // Create U-shaped boundary box in the middle of the screen
        this.boundaryBox = new BoundaryBox(
            this.engine,
            window.innerWidth,
            window.innerHeight,
        );

        // Create initial shapes to populate the simulation
        this.initialShapes = new InitialShapes(this.engine);
        
        // Count initial non-static bodies and set in game manager
        this.countAndSetInitialBodies();

        // Create input handler to manage user interactions
        this.inputHandler = new InputHandler(
            this.engine,
            this.bodyFactory,
            this.debugControl,
        );

        // Create body wrapper for screen wrapping effect
        // Note: The bounds extend beyond the screen to ensure smooth wrapping
        this.bodyWrapper = new BodyWrapper({
            min: { x: -100, y: 0 },                     // Extend left boundary
            max: { x: window.innerWidth + 100, y: window.innerHeight }, // Extend right boundary
        });

        // Set up the screen wrapping functionality
        this.setupBodyWrapping();

        // Set the viewport to show the entire screen
        this.engine.lookAt({
            min: { x: 0, y: 0 },
            max: { x: window.innerWidth, y: window.innerHeight },
        });
    }
    
    /**
     * Counts the initial non-static bodies and sets the count in the game manager
     */
    private countAndSetInitialBodies(): void {
        // Get all non-static bodies
        const nonStaticBodies = this.engine.getAllBodies().filter(body => !body.isStatic);
        
        // Set the initial count in the game manager
        this.gameManager.setInitialBodyCount(nonStaticBodies.length);
    }
    
    /**
     * Restarts the game by clearing all bodies and reinitializing
     */
    private restartGame(): void {
        console.log("Restarting game...");
        
        // Clear all bodies from the world
        const allBodies = this.engine.getAllBodies();
        Matter.Composite.clear(this.engine.getWorld(), false, true);
        
        // Re-create the boundary walls
        this.boundaryWalls = new BoundaryWalls(
            this.engine,
            window.innerWidth,
            window.innerHeight,
        );
        
        // Re-create the boundary box
        this.boundaryBox = new BoundaryBox(
            this.engine,
            window.innerWidth,
            window.innerHeight,
        );
        
        // Re-create the initial shapes
        this.initialShapes = new InitialShapes(this.engine);
        
        // Count and set the initial bodies again
        this.countAndSetInitialBodies();
        
        console.log("Game restarted successfully!");
    }

    /**
     * Sets up the screen wrapping functionality for all bodies
     * 
     * This method adds an event listener to the physics engine that
     * wraps bodies around the screen edges before each physics update.
     */
    private setupBodyWrapping(): void {
        // Add event listener to the 'beforeUpdate' event
        Matter.Events.on(this.engine.getEngine(), "beforeUpdate", () => {
            // Get all bodies in the simulation
            const allBodies = this.engine.getAllBodies();
            // Apply wrapping to each body
            for (const body of allBodies) {
                this.bodyWrapper.wrapBody(body);
            }
        });
    }

    /**
     * Starts the physics simulation
     * 
     * This method starts both the renderer and the physics engine.
     */
    public start(): void {
        this.engine.start();
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

// Initialize and start the simulation when the window loads
window.onload = function () {
    const simulation = new BallPoolSimulation();
    simulation.start();
};
