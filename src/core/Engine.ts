import Matter from "matter-js";
import { SimulationInstance, SimulationOptions } from "../types";

export class Engine {
    private engine: Matter.Engine;
    private world: Matter.World;
    private render: Matter.Render;
    private runner: Matter.Runner;
    private mouse: Matter.Mouse;
    private mouseConstraint: Matter.MouseConstraint;

    constructor(options: SimulationOptions) {
        // Create engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // Create renderer
        this.render = Matter.Render.create({
            element: options.element,
            engine: this.engine,
            options: {
                width: options.width,
                height: options.height,
                showAngleIndicator: options.showAngleIndicator || false,
                background: options.background || "#F0F0F0",
                wireframes: options.wireframes || false,
            },
        });

        // Create runner
        this.runner = Matter.Runner.create();
    }

    public start(): void {
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
    }

    public stop(): void {
        Matter.Render.stop(this.render);
        Matter.Runner.stop(this.runner);
    }

    public addBody(body: Matter.Body | Matter.Body[]): void {
        Matter.Composite.add(this.world, body);
    }

    public removeBody(body: Matter.Body): void {
        Matter.Composite.remove(this.world, body);
    }

    public getAllBodies(): Matter.Body[] {
        return Matter.Composite.allBodies(this.world);
    }

    public lookAt(
        bounds: {
            min: { x: number; y: number };
            max: { x: number; y: number };
        },
    ): void {
        Matter.Render.lookAt(this.render, bounds);
    }

    public getEngine(): Matter.Engine {
        return this.engine;
    }

    public getWorld(): Matter.World {
        return this.world;
    }

    public getRender(): Matter.Render {
        return this.render;
    }

    public getRunner(): Matter.Runner {
        return this.runner;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.render.canvas;
    }

    public getMouse(): Matter.Mouse {
        return this.mouse;
    }

    public getMouseConstraint(): Matter.MouseConstraint {
        return this.mouseConstraint;
    }

    public getInstance(): SimulationInstance {
        return {
            engine: this.engine,
            runner: this.runner,
            render: this.render,
            canvas: this.render.canvas,
            stop: this.stop.bind(this),
        };
    }
}
