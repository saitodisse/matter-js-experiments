/**
 * InputHandler.ts
 *
 * This file contains the InputHandler class, which manages all user input interactions
 * with the physics simulation, including mouse and keyboard events. It provides functionality
 * for creating, manipulating, and removing physics bodies through user input.
 */

import Matter from "matter-js";
import { Engine } from "../core/Engine";
import { BodyFactory } from "./BodyFactory";
import { DebugControl } from "./DebugControl";
import { GameManager } from "../core/GameManager";
import { ParticleSystem } from "../effects/ParticleSystem"; // Import ParticleSystem

/**
 * InputHandler Class
 *
 * Handles all user input events (mouse and keyboard) and translates them into
 * actions in the physics simulation, such as creating new bodies, applying forces,
 * or removing existing bodies.
 */
export class InputHandler {
    // Core components
    private engine: Engine;
    private bodyFactory: BodyFactory;
    private debugControl: DebugControl;
    // Mouse position
    private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
    // Canvas element
    private canvas: HTMLCanvasElement;
    // Particle system for visual effects
    private particleSystem: ParticleSystem | null = null; // Add particleSystem property
    // Game manager for tracking player actions
    private gameManager: GameManager;

    /**
     * InputHandler constructor
     *
     * @param engine - Reference to the physics engine
     * @param bodyFactory - Factory for creating physics bodies
     * @param debugControl - Debug control for logging events
     */
    constructor(
        engine: Engine,
        bodyFactory: BodyFactory,
        debugControl: DebugControl,
    ) {
        this.engine = engine;
        this.bodyFactory = bodyFactory;
        this.debugControl = debugControl;
        this.canvas = this.engine.getCanvas();
        this.gameManager = GameManager.getInstance();

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Sets the particle system instance.
     * @param particleSystem The ParticleSystem instance.
     */
    public setParticleSystem(particleSystem: ParticleSystem): void {
        this.particleSystem = particleSystem;
    }

    /**
     * Sets up all event listeners
     */
    private setupEventListeners(): void {
        // Mouse up event - triggered when a mouse button is released
        this.canvas.addEventListener(
            "mouseup",
            (event) => this.handleMouseUp(event),
        );

        // Click event - triggered after a complete click (down and up)
        this.canvas.addEventListener(
            "click",
            (event) => this.handleClick(event),
        );

        // Mouse move event - triggered when the mouse moves
        this.canvas.addEventListener(
            "mousemove",
            (event) => this.handleMouseMove(event),
        );

        // Keyboard events - triggered when a key is pressed
        document.addEventListener(
            "keydown",
            (event) => this.handleKeyDown(event),
        );
    }

    /**
     * Gets the mouse position relative to the canvas
     *
     * @param event - Mouse event
     * @returns Object with x and y coordinates
     */
    private getMousePosition(event: MouseEvent): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    /**
     * Handles mouse up events
     *
     * Currently only logs the event if debug mode is enabled.
     *
     * @param event - The mouse event
     */
    private handleMouseUp(event: MouseEvent): void {
        // Log the mouse up event if debug mode is enabled
        this.debugControl.logEvent("Mouse Up", {
            x: event.clientX,
            y: event.clientY,
            button: event.button === 0
                ? "Left"
                : event.button === 1
                ? "Middle"
                : "Right",
        });
    }

    /**
     * Handles click events
     *
     * Left-click: Applies a repelling force to clicked bodies
     * Ctrl+Left-click: Creates a random body at the click position
     *
     * @param event - The mouse event
     */
    private handleClick(event: MouseEvent): void {
        // Get the mouse position relative to the canvas
        const mousePosition = this.getMousePosition(event);
        // Store the mouse position for use in other methods
        this.mousePosition = mousePosition;

        // Get all bodies in the simulation
        const allBodies = this.engine.getAllBodies();

        // Find the first body that contains the mouse position
        const clickedBody = Matter.Query.point(allBodies, mousePosition)[0];

        // If a body was clicked
        if (clickedBody) {
            // If the body is static (like a wall), do nothing
            if (clickedBody.isStatic) {
                return;
            }

            // Calculate the direction from the mouse to the body
            const direction = Matter.Vector.sub(
                clickedBody.position,
                mousePosition,
            );
            // Normalize the direction vector
            const normalizedDirection = Matter.Vector.normalise(direction);
            // Calculate the distance between the mouse and the body
            const distance = Matter.Vector.magnitude(direction);
            // Calculate the force to apply (proportional to distance)
            const force = Matter.Vector.mult(
                normalizedDirection,
                distance * 0.015,
            );

            this.debugControl.logEvent("Body Repelled", {
                id: clickedBody.id,
                clickedBody,
                type: clickedBody.circleRadius
                    ? "Circle"
                    : clickedBody.vertices
                    ? "Polygon"
                    : "Rectangle",
                position: {
                    x: clickedBody.position.x,
                    y: clickedBody.position.y,
                },
                force: force,
                distance: distance,
            });

            // Increment the attempts counter BEFORE applying force
            // This ensures the "first attempt" state is set before physics might cause scoring
            this.gameManager.addAttempt();

            // Apply the force to the body
            Matter.Body.applyForce(
                clickedBody,
                clickedBody.position,
                force,
            );

            // --- Calculate Volume based on Click Distance Relative to Body Size ---
            let effectiveRadius = 50; // Default radius
            const minVolume = 0.2; // Minimum sound volume

            if (clickedBody.circleRadius && clickedBody.circleRadius > 0) {
                // Use circleRadius if it's a circle
                effectiveRadius = clickedBody.circleRadius;
            } else if (clickedBody.area && clickedBody.area > 0) {
                // Estimate radius from area for polygons (assuming roughly circular)
                effectiveRadius = Math.sqrt(clickedBody.area / Math.PI);
            }

            // Ensure radius is at least 1 to avoid division issues
            effectiveRadius = Math.max(1, effectiveRadius);

            // Calculate volume: minVolume at center, increasing to 1.0 at the effective edge
            const normalizedDistance = Math.min(
                1.0,
                distance / effectiveRadius,
            ); // Clamp distance ratio to 1.0
            const calculatedVolume = Math.max(
                minVolume,
                minVolume + normalizedDistance * (1.0 - minVolume),
            ); // Linear interpolation from minVolume up to 1.0

            // Play sound using AudioManager from GameManager
            this.gameManager.getAudioManager().playSound(
                "hit_01",
                calculatedVolume,
            );
            // Log calculated radius and volume for debugging
            this.debugControl.logEvent("Click Sound Volume", {
                distance,
                effectiveRadius,
                calculatedVolume,
            });
            // --- End Volume Calculation ---

            // Trigger particle explosion if the system is available
            if (this.particleSystem) {
                // Scale distance to a reasonable force value (e.g., 1-10)
                // Adjust the scaling factor (e.g., 0.1) and max value (e.g., 10) as needed
                const explosionForce = Math.min(
                    10,
                    Math.max(1, distance * 0.1),
                );
                this.particleSystem.createExplosion(
                    mousePosition.x,
                    mousePosition.y,
                    explosionForce * 1, //
                );
            }
        } else {
            // If Ctrl key is pressed and no body was clicked, create a random body
            if (event.ctrlKey && this.debugControl.isEnabled() === true) {
                const randomBody = this.bodyFactory.createRandomBody(
                    event.clientX,
                    event.clientY,
                );
                this.engine.addBody(randomBody);
            }
        }
    }

    /**
     * Handles mouse move events
     *
     * Right-click+drag: Removes bodies as the mouse moves over them
     * Ctrl+Left-click+drag: Creates random bodies along the mouse path
     *
     * @param event - The mouse event
     */
    private handleMouseMove(event: MouseEvent): void {
        // Only process if a mouse button is pressed
        if (event.buttons > 0) {
            // Determine which button is pressed
            const button = event.buttons === 1
                ? "Left"
                : event.buttons === 4
                ? "Middle"
                : "Right";

            // Log the mouse move event if debug mode is enabled
            this.debugControl.logEvent(`${button} Mouse Move (while pressed)`, {
                x: event.clientX,
                y: event.clientY,
                button: button,
            });

            // Handle Ctrl+Left-click drag (create bodies) only in debug mode
            if (
                button === "Left" && event.ctrlKey &&
                this.debugControl.isEnabled() === true
            ) {
                // Limit the creation rate to avoid creating too many bodies
                const currentTime = Date.now();
                if (
                    !(window as any).lastCreationTime ||
                    currentTime - (window as any).lastCreationTime >= 100
                ) {
                    // Create a random body at the current mouse position
                    const randomBody = this.bodyFactory.createRandomBody(
                        event.clientX,
                        event.clientY,
                    );
                    this.engine.addBody(randomBody);
                    // Update the last creation time
                    (window as any).lastCreationTime = currentTime;
                }
            }
        }
    }

    /**
     * Handles keyboard events
     *
     * Delete key: Removes the first non-static body found in the world
     *
     * @param event - The keyboard event
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Handle Delete key press
        if (event.key === "Delete" && this.debugControl.isEnabled() === true) {
            // Get all bodies in the world
            const bodies = this.engine.getAllBodies();
            // Find and remove the first non-static body
            for (const body of bodies) {
                if (!body.isStatic) {
                    // Log the removal if debug mode is enabled
                    this.debugControl.logEvent("Object Removed (DEL key)", {
                        id: body.id,
                        type: body.circleRadius
                            ? "Circle"
                            : body.vertices
                            ? "Polygon"
                            : "Rectangle",
                        position: {
                            x: body.position.x,
                            y: body.position.y,
                        },
                    });
                    // Remove the body from the physics engine
                    this.engine.removeBody(body);
                    break;
                }
            }
        }
    }
}
