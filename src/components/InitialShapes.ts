/**
 * InitialShapes.ts
 * 
 * This file contains the InitialShapes class, which creates a set of initial shapes
 * in the physics simulation. These shapes serve as starting objects for the user to interact with.
 */

import Matter from "matter-js";
import { Engine } from "../core/Engine";

/**
 * InitialShapes Class
 * 
 * Creates and manages a set of initial physics bodies with different shapes
 * (triangle, pentagon, rectangle) that are added to the simulation at startup.
 */
export class InitialShapes {
    // Reference to the physics engine
    private engine: Engine;
    // Array to store the shape bodies
    private shapes: Matter.Body[] = [];

    /**
     * InitialShapes constructor
     * 
     * @param engine - Reference to the physics engine
     */
    constructor(engine: Engine) {
        this.engine = engine;
        this.createShapes();
    }

    /**
     * Creates the initial set of shapes
     * 
     * This method creates three different shapes (triangle, pentagon, rectangle)
     * with specific properties and adds them to the physics simulation.
     */
    private createShapes(): void {
        // Create a triangle shape
        const triangle = Matter.Bodies.polygon(200, 460, 3, 60, {
            restitution: 0.9,  // Bounciness (0 = no bounce, 1 = perfect bounce)
            friction: 0.1,      // Surface friction
            render: {
                fillStyle: "#4CAF50",    // Green fill color
                strokeStyle: "#388E3C",  // Dark green border
                lineWidth: 2,            // Border thickness
            },
        });

        // Create a pentagon shape
        const pentagon = Matter.Bodies.polygon(400, 460, 5, 60, {
            restitution: 0.9,  // Bounciness
            friction: 0.1,      // Surface friction
            render: {
                fillStyle: "#2196F3",    // Blue fill color
                strokeStyle: "#1976D2",  // Dark blue border
                lineWidth: 2,            // Border thickness
            },
        });

        // Create a rectangular shape
        const rectangle = Matter.Bodies.rectangle(600, 460, 80, 80, {
            restitution: 0.9,  // Bounciness
            friction: 0.1,      // Surface friction
            render: {
                fillStyle: "#FFC107",    // Amber/yellow fill color
                strokeStyle: "#FF8F00",  // Dark amber border
                lineWidth: 2,            // Border thickness
            },
        });

        // Store all shapes in the array
        this.shapes = [triangle, pentagon, rectangle];
        // Add all shapes to the physics engine
        this.engine.addBody(this.shapes);
    }

    /**
     * Returns all shape bodies
     * 
     * @returns Array of Matter.js bodies representing the shapes
     */
    public getShapes(): Matter.Body[] {
        return this.shapes;
    }
}
