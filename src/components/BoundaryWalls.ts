/**
 * BoundaryWalls.ts
 * 
 * This file contains the BoundaryWalls class, which creates and manages the boundary walls
 * around the simulation area. These walls prevent physics objects from leaving the screen.
 */

import Matter from "matter-js";
import { Engine } from "../core/Engine";

/**
 * BoundaryWalls Class
 * 
 * Creates and manages the four boundary walls (top, bottom, left, right) that
 * surround the simulation area. The walls are static bodies that prevent
 * other physics objects from leaving the screen.
 */
export class BoundaryWalls {
    // Reference to the physics engine
    private engine: Engine;
    // Array to store the wall bodies
    private walls: Matter.Body[] = [];
    // Width of the canvas/screen
    private width: number;
    // Height of the canvas/screen
    private height: number;

    /**
     * BoundaryWalls constructor
     * 
     * @param engine - Reference to the physics engine
     * @param width - Width of the canvas/screen
     * @param height - Height of the canvas/screen
     */
    constructor(engine: Engine, width: number, height: number) {
        this.engine = engine;
        this.width = width;
        this.height = height;
        this.createWalls();
    }

    /**
     * Creates the four boundary walls
     * 
     * This method creates four static rectangular bodies positioned at the edges
     * of the screen to act as boundary walls for the simulation.
     */
    private createWalls(): void {
        // Bottom wall - positioned at the bottom edge of the screen
        const bottomWall = Matter.Bodies.rectangle(
            this.width / 2,      // X position (center of the screen horizontally)
            this.height,         // Y position (bottom edge of the screen)
            this.width,          // Width (full screen width)
            50.5,                // Height (thickness of the wall)
            {
                isStatic: true,  // Make it a static body (doesn't move)
                render: {
                    fillStyle: "#060a19",  // Dark blue fill color
                    strokeStyle: "#000",   // Black border
                    lineWidth: 2,          // Border thickness
                },
            },
        );

        // Left wall - positioned at the left edge of the screen
        const leftWall = Matter.Bodies.rectangle(
            0,                   // X position (left edge of the screen)
            this.height / 2,     // Y position (center of the screen vertically)
            50.5,                // Width (thickness of the wall)
            this.height,         // Height (full screen height)
            {
                isStatic: true,  // Make it a static body
                render: {
                    fillStyle: "#060a19",  // Dark blue fill color
                    strokeStyle: "#000",   // Black border
                    lineWidth: 2,          // Border thickness
                },
            },
        );

        // Right wall - positioned at the right edge of the screen
        const rightWall = Matter.Bodies.rectangle(
            this.width,          // X position (right edge of the screen)
            this.height / 2,     // Y position (center of the screen vertically)
            50.5,                // Width (thickness of the wall)
            this.height,         // Height (full screen height)
            {
                isStatic: true,  // Make it a static body
                render: {
                    fillStyle: "#060a19",  // Dark blue fill color
                    strokeStyle: "#000",   // Black border
                    lineWidth: 2,          // Border thickness
                },
            },
        );

        // Top wall - positioned at the top edge of the screen
        const topWall = Matter.Bodies.rectangle(
            this.width / 2,      // X position (center of the screen horizontally)
            0,                   // Y position (top edge of the screen)
            this.width,          // Width (full screen width)
            50.5,                // Height (thickness of the wall)
            {
                isStatic: true,  // Make it a static body
                render: {
                    fillStyle: "#060a19",  // Dark blue fill color
                    strokeStyle: "#000",   // Black border
                    lineWidth: 2,          // Border thickness
                },
            },
        );

        // Store all walls in the array
        this.walls = [bottomWall, leftWall, rightWall, topWall];
        // Add all walls to the physics engine
        this.engine.addBody(this.walls);
    }

    /**
     * Returns all wall bodies
     * 
     * @returns Array of Matter.js bodies representing the walls
     */
    public getWalls(): Matter.Body[] {
        return this.walls;
    }

    /**
     * Resizes the walls when the canvas/screen size changes
     * 
     * @param width - New width of the canvas/screen
     * @param height - New height of the canvas/screen
     */
    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        // Remove old walls from the physics engine
        for (const wall of this.walls) {
            this.engine.removeBody(wall);
        }

        // Create new walls with updated dimensions
        this.createWalls();
    }
}
