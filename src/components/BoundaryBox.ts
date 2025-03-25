/**
 * BoundaryBox.ts
 *
 * This file contains the BoundaryBox class, which creates a U-shaped box with bottom and side walls
 * in the Matter.js physics simulation. The box serves as a container for physics objects.
 */

import Matter from "matter-js";
import { Engine } from "../core/Engine";
import { GameManager } from "../core/GameManager";

/**
 * BoundaryBox Class
 *
 * Creates and manages a U-shaped box with bottom and side walls in a specific position
 * on the screen. The box is made of static bodies that can interact with other physics objects.
 * When a body enters the box, it will be destroyed and a point will be added to the player's score.
 */
export class BoundaryBox {
    // Reference to the physics engine
    private engine: Engine;
    // Array to store the box parts (walls)
    private boxParts: Matter.Body[] = [];
    // Width of the canvas/screen
    private width: number;
    // Height of the canvas/screen
    private height: number;
    // Box dimensions and position
    private boxDimensions: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    // Reference to the game manager
    private gameManager: GameManager;

    /**
     * BoundaryBox constructor
     *
     * @param engine - Reference to the physics engine
     * @param width - Width of the canvas/screen
     * @param height - Height of the canvas/screen
     */
    constructor(engine: Engine, width: number, height: number) {
        this.engine = engine;
        this.width = width;
        this.height = height;
        this.gameManager = GameManager.getInstance();
        this.createBoxParts();
        this.setupCollisionDetection();
        this.handleCollision();
    }

    /**
     * Creates the box parts (bottom and side walls)
     *
     * This method calculates the dimensions and positions of the box parts
     * and creates static Matter.js bodies to represent them.
     */
    private createBoxParts(): void {
        // Define fixed dimensions for the box
        const BoxA_width = 180;
        const BoxA_height = 140;

        // Calculate position for the box (near the bottom-right corner of the screen)
        const BoxA_x_position = this.width - (50.5 / 1.2 + BoxA_width / 2);
        const BoxA_y_position = this.height - (50.5 / 1.2 + BoxA_height / 2);

        // Store box dimensions for collision detection
        this.boxDimensions = {
            x: BoxA_x_position - BoxA_width / 2,
            y: BoxA_y_position - BoxA_height / 2,
            width: BoxA_width,
            height: BoxA_height,
        };

        // Log box dimensions and position for debugging
        console.log(
            "BoxA",
            {
                width: this.width,
                height: this.height,
                BoxA_x_position,
                BoxA_y_position,
                BoxA_width,
                BoxA_height,
            },
        );

        // Create the bottom wall of the box
        const bottomBox = Matter.Bodies.rectangle(
            BoxA_x_position, // X position (center of the bottom wall)
            BoxA_y_position + BoxA_height / 2, // Y position (bottom of the box)
            BoxA_width, // Width (same as box width)
            2, // Height (thin wall)
            {
                isStatic: true, // Make it a static body (doesn't move)
                render: {
                    fillStyle: "#060a19", // Dark blue fill color
                    strokeStyle: "#000", // Black border
                    lineWidth: 2, // Border thickness
                },
            },
        );

        // Create the left wall of the box
        const leftBox = Matter.Bodies.rectangle(
            BoxA_x_position - BoxA_width / 2, // X position (left edge of the box)
            BoxA_y_position, // Y position (center of the left wall)
            2, // Width (thin wall)
            BoxA_height, // Height (same as box height)
            {
                isStatic: true, // Make it a static body
                render: {
                    fillStyle: "#060a19", // Dark blue fill color
                    strokeStyle: "#000", // Black border
                    lineWidth: 2, // Border thickness
                },
            },
        );

        // Create the right wall of the box
        const rightBox = Matter.Bodies.rectangle(
            BoxA_x_position + BoxA_width / 2, // X position (right edge of the box)
            BoxA_y_position, // Y position (center of the right wall)
            2, // Width (thin wall)
            BoxA_height, // Height (same as box height)
            {
                isStatic: true, // Make it a static body
                render: {
                    fillStyle: "#060a19", // Dark blue fill color
                    strokeStyle: "#000", // Black border
                    lineWidth: 2, // Border thickness
                },
            },
        );

        // Add all box parts to the array
        this.boxParts.push(bottomBox, leftBox, rightBox);

        // Add all box parts to the physics engine
        this.engine.addBody(this.boxParts);
    }

    /**
     * Sets up collision detection for bodies entering the box
     */
    private setupCollisionDetection(): void {
        // Check for bodies inside the box on each update
        Matter.Events.on(this.engine.getEngine(), "afterUpdate", () => {
            this.checkBodiesInBox();
        });
    }

    /**
     * Handles collision events with the box
     * 
     * This method is called when a collision is detected between a body and the box.
     * If a body enters the box, it will be destroyed and a point will be added to the score.
     */
    private handleCollision(): void {
        // Get the game manager instance
        const gameManager = GameManager.getInstance();
        
        // Add event listener for collision events
        Matter.Events.on(this.engine.getEngine(), "collisionStart", (event) => {
            // Get all collision pairs from the event
            const pairs = event.pairs;

            // Loop through all collision pairs
            for (const pair of pairs) {
                // Get the two bodies involved in the collision
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check if one of the bodies is part of the box
                const isBoxPartA = this.boxParts.includes(bodyA);
                const isBoxPartB = this.boxParts.includes(bodyB);

                // If neither body is part of the box, skip this pair
                if (!isBoxPartA && !isBoxPartB) {
                    continue;
                }

                // Get the other body (not the box part)
                const otherBody = isBoxPartA ? bodyB : bodyA;

                // Skip if the other body is static (like a wall)
                if (otherBody.isStatic) {
                    continue;
                }

                // Check if the body is inside the box
                if (this.isBodyInsideBox(otherBody)) {
                    // Add a point to the score
                    gameManager.addScore();
                    
                    // Remove the body from the world
                    Matter.Composite.remove(this.engine.getWorld(), otherBody);
                    
                    // Check if the game is over after removing the body
                    gameManager.checkGameOver();
                }
            }
        });
    }

    /**
     * Checks if any bodies are inside the box and handles them
     */
    private checkBodiesInBox(): void {
        // Get all bodies in the simulation
        const allBodies = this.engine.getAllBodies();

        // Filter out static bodies (like walls) and check if any are inside the box
        const bodiesToCheck = allBodies.filter((body) => !body.isStatic);

        for (const body of bodiesToCheck) {
            // Check if the body's center is inside the box
            if (this.isBodyInBox(body)) {
                // Remove the body from the simulation
                this.engine.removeBody(body);

                // Increment the score using the game manager
                this.gameManager.addScore();

                // Log the event for debugging
                console.log(
                    `Body ${body.id} entered the box!`,
                );
            }
        }
    }

    /**
     * Checks if a body is inside the box
     *
     * @param body - The body to check
     * @returns True if the body is inside the box, false otherwise
     */
    private isBodyInBox(body: Matter.Body): boolean {
        // Get the body's position
        const { x, y } = body.position;

        // Check if the body's center is inside the box
        return (
            x > this.boxDimensions.x &&
            x < this.boxDimensions.x + this.boxDimensions.width &&
            y > this.boxDimensions.y + 85 &&
            y < this.boxDimensions.y + this.boxDimensions.height
        );
    }

    private isBodyInsideBox(body: Matter.Body): boolean {
        // Get the body's position
        const { x, y } = body.position;

        // Check if the body's center is inside the box
        return (
            x > this.boxDimensions.x &&
            x < this.boxDimensions.x + this.boxDimensions.width &&
            y > this.boxDimensions.y &&
            y < this.boxDimensions.y + this.boxDimensions.height
        );
    }

    /**
     * Returns all box parts (walls)
     *
     * @returns Array of Matter.js bodies representing the box parts
     */
    public getBoxs(): Matter.Body[] {
        return this.boxParts;
    }

    /**
     * Resizes the box when the canvas/screen size changes
     *
     * @param width - New width of the canvas/screen
     * @param height - New height of the canvas/screen
     */
    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        // Remove old box parts from the physics engine
        for (const box of this.boxParts) {
            this.engine.removeBody(box);
        }

        // Create new box parts with updated dimensions
        this.createBoxParts();
    }
}
