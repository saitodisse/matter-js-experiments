/**
 * BoundaryBox.ts
 *
 * This file contains the BoundaryBox class, which creates a U-shaped box with bottom and side walls
 * in the Matter.js physics simulation. The box serves as a container for physics objects.
 */

import Matter from "matter-js";
import { Engine } from "../core/Engine";
import { GameManager } from "../core/GameManager";
import { Bounds } from "matter-js";
import { DebugControl } from "./DebugControl";
import { MatterParticleSystem } from "../effects/MatterParticleSystem"; // Import the new system
import {
    CATEGORY_EFFECT_PARTICLE,
    CATEGORY_GAME_SHAPE,
    CATEGORY_WALL,
} from "../types";
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
    private bottomBox: Matter.Body | null = null; // Added property to store the bottom wall specifically
    // Width of the canvas/screen
    private width: number;
    // Height of the canvas/screen
    private height: number;
    // Box dimensions and position
    // Box dimensions and calculated bounds
    private boxDimensions: { width: number; height: number } | undefined;
    private boxBounds: Bounds | undefined; // Use Matter.js Bounds type
    // Reference to the game manager
    private gameManager: GameManager;
    // Reference to the debug control
    private readonly debugControl: DebugControl;
    // Reference to the Matter particle system
    private matterParticleSystem: MatterParticleSystem;

    /**
     * BoundaryBox constructor
     *
     * @param engine - Reference to the physics engine
     * @param width - Width of the canvas/screen
     * @param height - Height of the canvas/screen
     * @param debugControl - Reference to the debug control instance
     * @param matterParticleSystem - Reference to the Matter particle system instance
     */
    constructor(
        engine: Engine,
        width: number,
        height: number,
        debugControl: DebugControl,
        matterParticleSystem: MatterParticleSystem, // Add parameter
    ) {
        this.engine = engine;
        this.width = width;
        this.height = height;
        this.debugControl = debugControl;
        this.matterParticleSystem = matterParticleSystem; // Store the instance
        this.gameManager = GameManager.getInstance();
        this.createBoxParts(); // This will now calculate random position
        // this.setupCollisionDetection(); // Remove this - rely on handleCollision
        this.handleCollision();
    }

    /**
     * Returns the calculated bounds of the box.
     * @returns The bounds object { min: { x, y }, max: { x, y } }
     */
    public getBounds(): Bounds {
        if (!this.boxBounds) {
            throw new Error("Box bounds not calculated");
        }
        return this.boxBounds;
    }

    /**
     * Creates the box parts (bottom and side walls)
     *
     * This method calculates the dimensions and positions of the box parts
     * and creates static Matter.js bodies to represent them.
     */
    private createBoxParts(): void {
        // Define fixed dimensions for the box
        const boxWidth = 180;
        const boxHeight = 140;
        this.boxDimensions = { width: boxWidth, height: boxHeight }; // Store fixed dimensions

        // --- Random Position Calculation ---
        const padding = 60; // Min distance from screen edges and boundary walls thickness
        const minX = padding + boxWidth / 2;
        const maxX = this.width - padding - boxWidth / 2;
        // const minY = padding + boxHeight / 2; // No longer needed for random Y
        // const maxY = this.height - padding - boxHeight / 2; // No longer needed for random Y

        // Ensure valid range before calculating random position
        const randomX = maxX > minX
            ? (Math.random() * (maxX - minX) + minX)
            : this.width / 2;
        // const randomY = maxY > minY ? (Math.random() * (maxY - minY) + minY) : this.height / 2; // Remove random Y calculation

        const boxCenterX = randomX;
        const bottomPadding = 33; // Small padding from the bottom boundary wall
        const boxCenterY = this.height - (boxHeight / 2) - bottomPadding; // Position near the bottom
        // --- End Random Position Calculation ---

        // Store box dimensions for collision detection
        // Store calculated bounds for collision detection and external access
        this.boxBounds = {
            min: {
                x: boxCenterX - boxWidth / 2,
                y: boxCenterY - boxHeight / 2,
            },
            max: {
                x: boxCenterX + boxWidth / 2,
                y: boxCenterY + boxHeight / 2,
            },
        };

        // Log box dimensions and position for debugging
        this.debugControl.logEvent("BoundaryBoxCreated", {
            canvasWidth: this.width,
            canvasHeight: this.height,
            boxCenterX,
            boxCenterY,
            boxWidth,
            boxHeight,
            bounds: this.boxBounds,
        });

        const WALL_THICKNESS = 20;

        // Create the bottom wall of the box
        // Create the bottom wall of the box using calculated center and dimensions
        const bottomBox = Matter.Bodies.rectangle( // Assign to a property for later check
            boxCenterX, // X position (center of the bottom wall)
            boxCenterY + boxHeight / 2, // Y position (bottom edge of the box)
            boxWidth, // Width (same as box width)
            WALL_THICKNESS, // Height (thickness of the wall) - increased thickness slightly
            {
                isStatic: true, // Make it a static body (doesn't move)
                collisionFilter: {
                    category: CATEGORY_WALL,
                    mask: CATEGORY_GAME_SHAPE | CATEGORY_WALL |
                        CATEGORY_EFFECT_PARTICLE, // Collide with shapes, walls, particles
                },
                render: {
                    fillStyle: "#060a19", // Dark blue fill color
                    strokeStyle: "#000", // Black border
                    lineWidth: 2, // Border thickness
                },
            },
        );

        // Create the left wall of the box
        // Create the left wall of the box
        const leftBox = Matter.Bodies.rectangle(
            boxCenterX - boxWidth / 2, // X position (left edge of the box)
            boxCenterY, // Y position (center of the left wall)
            WALL_THICKNESS, // Width (thickness of the wall)
            boxHeight, // Height (same as box height)
            {
                isStatic: true, // Make it a static body
                collisionFilter: {
                    category: CATEGORY_WALL,
                    mask: CATEGORY_GAME_SHAPE | CATEGORY_WALL |
                        CATEGORY_EFFECT_PARTICLE, // Collide with shapes, walls, particles
                },
                render: {
                    fillStyle: "#060a19", // Dark blue fill color
                    strokeStyle: "#000", // Black border
                    lineWidth: 2, // Border thickness
                },
            },
        );

        // Create the right wall of the box
        // Create the right wall of the box
        const rightBox = Matter.Bodies.rectangle(
            boxCenterX + boxWidth / 2, // X position (right edge of the box)
            boxCenterY, // Y position (center of the right wall)
            WALL_THICKNESS, // Width (thickness of the wall)
            boxHeight, // Height (same as box height)
            {
                isStatic: true, // Make it a static body
                collisionFilter: {
                    category: CATEGORY_WALL,
                    mask: CATEGORY_GAME_SHAPE | CATEGORY_WALL |
                        CATEGORY_EFFECT_PARTICLE, // Collide with shapes, walls, particles
                },
                render: {
                    fillStyle: "#060a19", // Dark blue fill color
                    strokeStyle: "#000", // Black border
                    lineWidth: 2, // Border thickness
                },
            },
        );

        // Add all box parts to the array
        this.boxParts.push(bottomBox, leftBox, rightBox); // Keep track of all parts
        // Store bottomBox separately for specific collision check
        this.bottomBox = bottomBox;
        // Line 181 was a duplicate assignment, removed.

        // Add all box parts to the physics engine
        this.engine.addBody(this.boxParts);
    }

    // Removed setupCollisionDetection and checkBodiesInBox methods
    // Collision is handled by handleCollision using 'collisionStart' event
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

                // --- Pocketing Logic ---
                // Ignore pocketing logic if the colliding body is an effect particle
                if (
                    otherBody.collisionFilter?.category ===
                        CATEGORY_EFFECT_PARTICLE
                ) {
                    continue;
                }

                // Check if the collision involves the specific bottomBox part (and ensure it's not null)
                const collidedWithBottom = this.bottomBox &&
                    ((bodyA === this.bottomBox && bodyB === otherBody) ||
                        (bodyB === this.bottomBox && bodyA === otherBody));

                if (collidedWithBottom) {
                    // *** FIX: Only process pocketing if the first attempt has been made ***
                    if (gameManager.isFirstAttemptMade()) {
                        // Log the event for debugging
                        this.debugControl.logEvent("BodyPocketed", {
                            bodyId: otherBody.id,
                            firstAttemptMade: true,
                        });

                        // Call GameManager to handle scoring
                        gameManager.addScore();

                        // --- Trigger Particle Explosion ---
                        const explosionPosition = otherBody.position;
                        // The normal points from bodyA to bodyB. We want the direction *away* from the bottomBox.
                        let explosionDirection = pair.collision.normal;
                        if (bodyA === otherBody) {
                            // Normal points from bottomBox to otherBody (away from wall) - Use directly
                        } else {
                            // Normal points from otherBody to bottomBox (towards wall) - Negate it
                            explosionDirection = Matter.Vector.neg(
                                explosionDirection,
                            );
                        }
                        // Ensure the direction points generally upwards (negative y)
                        if (explosionDirection.y > 0) {
                            explosionDirection.y *= -1;
                        }
                        this.matterParticleSystem.createPocketExplosion(
                            explosionPosition,
                            explosionDirection,
                            2, // Increased base force for stronger explosion
                        );
                        // --- End Particle Explosion ---

                        // Remove the body from the world using setTimeout to avoid modifying composite during collision event
                        // Check round over *after* removal is confirmed.
                        setTimeout(() => {
                            // Double-check if the body still exists before removing
                            if (
                                this.engine.getWorld().bodies.includes(
                                    otherBody,
                                )
                            ) {
                                Matter.Composite.remove(
                                    this.engine.getWorld(),
                                    otherBody,
                                );
                                this.debugControl?.logEvent("BodyRemoved", {
                                    bodyId: otherBody.id,
                                });
                                // Check if the round/match is over *after* removing the body
                                // Round/match over check is now handled internally by RoundManager/MatchManager after score update
                            } else {
                                this.debugControl?.logEvent(
                                    "BodyRemoveSkipped",
                                    {
                                        bodyId: otherBody.id,
                                        reason: "Already removed",
                                    },
                                );
                            }
                        }, 0);
                    } else {
                        // Log that pocketing was ignored because the first attempt wasn't made
                        this.debugControl.logEvent("BodyPocketIgnored", {
                            bodyId: otherBody.id,
                            reason: "First attempt not made yet",
                        });
                        // Do NOT remove the body or add score
                    }
                }
            }
        });
    }

    // Removed checkBodiesInBox, isBodyInBox and isBodyInsideBox methods

    /**
     * Returns all box parts (walls)
     *
     * @returns Array of Matter.js bodies representing the box parts
     */
    public getBoxs(): Matter.Body[] {
        return this.boxParts;
    }

    // Removed resize method - conflicts with random positioning
}
