import "./style.css";
import { Engine } from "./core/Engine";
import { BodyFactory } from "./components/BodyFactory";
import { DebugControl } from "./components/DebugControl";
import { InputHandler } from "./components/InputHandler";
import { BoundaryWalls } from "./components/BoundaryWalls";
import { InitialShapes } from "./components/InitialShapes";
import { BodyWrapper } from "./utils/BodyWrapper";
import Matter from "matter-js";

class BallPoolSimulation {
    private engine: Engine;
    private debugControl: DebugControl;
    private bodyFactory: BodyFactory;
    private inputHandler: InputHandler;
    private boundaryWalls: BoundaryWalls;
    private initialShapes: InitialShapes;
    private bodyWrapper: BodyWrapper;

    constructor() {
        // Create the physics engine with render
        this.engine = new Engine({
            element: document.body,
            width: window.innerWidth,
            height: window.innerHeight,
            showAngleIndicator: false,
            background: "#F0F0F0",
            wireframes: false,
        });

        // Create debug control
        this.debugControl = new DebugControl(
            this.engine.getEngine(),
            this.engine.getRender(),
        );

        // Create body factory
        this.bodyFactory = new BodyFactory(this.debugControl);

        // Create boundary walls
        this.boundaryWalls = new BoundaryWalls(
            this.engine,
            window.innerWidth,
            window.innerHeight,
        );

        // Create initial shapes
        this.initialShapes = new InitialShapes(this.engine);

        // Create input handler
        this.inputHandler = new InputHandler(
            this.engine,
            this.bodyFactory,
            this.debugControl,
        );

        // Create body wrapper for screen wrapping
        this.bodyWrapper = new BodyWrapper({
            min: { x: -100, y: 0 },
            max: { x: window.innerWidth + 100, y: window.innerHeight },
        });

        // Set up screen wrapping for all bodies
        this.setupBodyWrapping();

        // Set up viewport
        this.engine.lookAt({
            min: { x: 0, y: 0 },
            max: { x: window.innerWidth, y: window.innerHeight },
        });
    }

    private setupBodyWrapping(): void {
        // Set up event to wrap bodies around the screen
        Matter.Events.on(this.engine.getEngine(), "beforeUpdate", () => {
            const allBodies = this.engine.getAllBodies();
            for (const body of allBodies) {
                this.bodyWrapper.wrapBody(body);
            }
        });
    }

    public start(): void {
        this.engine.start();
    }

    public stop(): void {
        this.engine.stop();
    }
}

// Start the simulation when the window loads
window.onload = function () {
    const simulation = new BallPoolSimulation();
    simulation.start();
};
