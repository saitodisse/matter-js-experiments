/**
 * InitialShapes.ts
 * 
 * This file contains the InitialShapes class, which creates a set of initial shapes
 * in the physics simulation. These shapes serve as starting objects for the user to interact with.
 */

import Matter, { Bounds } from "matter-js";
import { Engine } from "../core/Engine";
import { BoundaryBox } from "./BoundaryBox"; // Import BoundaryBox
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
    // Reference to the boundary box
    private boundaryBox: BoundaryBox;

    /**
     * InitialShapes constructor
     * 
     * @param engine - Reference to the physics engine
     * @param boundaryBox - Reference to the boundary box instance
     */
    constructor(engine: Engine, boundaryBox: BoundaryBox) { // Add boundaryBox parameter
        this.engine = engine;
        this.boundaryBox = boundaryBox; // Store boundaryBox reference
        this.createShapes();
    }

    /**
     * Creates the initial set of shapes
     * 
     * This method creates three different shapes (triangle, pentagon, rectangle)
     * with specific properties and adds them to the physics simulation.
     */
    private createShapes(): void {
        const screenWidth = this.engine.getRender().options.width ?? window.innerWidth;
        const screenHeight = this.engine.getRender().options.height ?? window.innerHeight;
        const boxBounds = this.boundaryBox.getBounds();
        const safeDistance = 150; // Minimum distance from the box edges

        // Helper function to generate a safe random position
        const generateSafePosition = (shapeRadius: number): { x: number; y: number } => {
            let x: number;
            let y: number;
            let isSafe: boolean;
            const padding = shapeRadius + 10; // Padding from screen edges

            do {
                // Generate random position within screen bounds (with padding)
                x = Matter.Common.random(padding, screenWidth - padding);
                y = Matter.Common.random(padding, screenHeight - padding);

                // Check distance from box bounds
                const closestX = Math.max(boxBounds.min.x, Math.min(x, boxBounds.max.x));
                const closestY = Math.max(boxBounds.min.y, Math.min(y, boxBounds.max.y));
                const distanceX = x - closestX;
                const distanceY = y - closestY;
                const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

                // Check if outside the box's "safe zone" (box bounds + safeDistance)
                isSafe = distanceSquared > (safeDistance * safeDistance);

            } while (!isSafe); // Keep trying until a safe position is found

            return { x, y };
        };


        // --- Create shapes with random safe positions ---
        const shapeRadiusEstimate = 60; // Estimate for padding/distance checks

        // Create a triangle shape at a random safe position
        const trianglePos = generateSafePosition(shapeRadiusEstimate);
        const triangle = Matter.Bodies.polygon(trianglePos.x, trianglePos.y, 3, 60, {
            restitution: 0.9,
            friction: 0.1,
            render: {
                fillStyle: "#4CAF50",
                strokeStyle: "#388E3C",
                lineWidth: 2,
            },
        });

        // Create a pentagon shape at a random safe position
        const pentagonPos = generateSafePosition(shapeRadiusEstimate);
        const pentagon = Matter.Bodies.polygon(pentagonPos.x, pentagonPos.y, 5, 60, {
            restitution: 0.9,
            friction: 0.1,
            render: {
                fillStyle: "#2196F3",
                strokeStyle: "#1976D2",
                lineWidth: 2,
            },
        });

        // Create a rectangular shape at a random safe position
        const rectPos = generateSafePosition(shapeRadiusEstimate); // Use estimate for rectangle too
        const rectangle = Matter.Bodies.rectangle(rectPos.x, rectPos.y, 80, 80, {
            restitution: 0.9,
            friction: 0.1,
            render: {
                fillStyle: "#FFC107",
                strokeStyle: "#FF8F00",
                lineWidth: 2,
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
