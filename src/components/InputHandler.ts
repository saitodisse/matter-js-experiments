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
     * Sets up all event listeners
     */
    private setupEventListeners(): void {
        // Mouse down event - triggered when a mouse button is pressed
        this.canvas.addEventListener(
            "mousedown",
            (event) => this.handleMouseDown(event),
        );

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

        // Context menu event - triggered on right-click
        this.canvas.addEventListener(
            "contextmenu",
            (event) => this.handleContextMenu(event),
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
            y: event.clientY - rect.top
        };
    }

    /**
     * Handles mouse down events
     * 
     * For right-click (button 2), removes non-static bodies at the click position.
     * 
     * @param event - The mouse event
     */
    private handleMouseDown(event: MouseEvent): void {
        // Log the mouse down event if debug mode is enabled
        this.debugControl.logEvent("Mouse Down", {
            x: event.clientX,
            y: event.clientY,
            button: event.button === 0
                ? "Left"
                : event.button === 1
                ? "Middle"
                : "Right",
        });

        // Handle right-click (button 2)
        if (event.button === 2) {
            // Find all bodies at the click position
            const bodies = Matter.Query.point(this.engine.getAllBodies(), {
                x: event.clientX,
                y: event.clientY,
            });

            // Log the found bodies if debug mode is enabled
            this.debugControl.logEvent("Query Bodies", {
                bodies: bodies.map((body) => body.id),
            });

            // Remove all non-static bodies at the click position
            for (const body of bodies) {
                if (!body.isStatic) {
                    // Log the removal if debug mode is enabled
                    this.debugControl.logEvent("Object Removed", {
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
                }
            }
        }
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

            // Apply the force to the body
            Matter.Body.applyForce(
                clickedBody,
                clickedBody.position,
                force,
            );
            
            // Increment the attempts counter in the game manager
            this.gameManager.addAttempt();

            // Log the repelling action if debug mode is enabled
            this.debugControl.logEvent("Body Repelled", {
                id: clickedBody.id,
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
        } else {
            // If Ctrl key is pressed and no body was clicked, create a random body
            if (event.ctrlKey) {
                const randomBody = this.bodyFactory.createRandomBody(
                    event.clientX,
                    event.clientY,
                );
                this.engine.addBody(randomBody);
            }
        }
    }

    /**
     * Handles context menu events (right-click)
     * 
     * Prevents the default context menu from appearing.
     * 
     * @param event - The mouse event
     */
    private handleContextMenu(event: MouseEvent): void {
        // Prevent the default context menu from appearing
        event.preventDefault();
        // Log the right-click event if debug mode is enabled
        this.debugControl.logEvent("Right Click - Object Removed", {
            x: event.clientX,
            y: event.clientY,
            button: "Right",
        });
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

            // Handle right-click drag (remove bodies)
            if (button === "Right") {
                // Find all bodies at the current mouse position
                const bodies = Matter.Query.point(this.engine.getAllBodies(), {
                    x: event.clientX,
                    y: event.clientY,
                });

                // Remove the first non-static body found
                if (bodies.length > 0 && !bodies[0].isStatic) {
                    this.engine.removeBody(bodies[0]);
                }
            }

            // Handle Ctrl+Left-click drag (create bodies)
            if (button === "Left" && event.ctrlKey) {
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
        if (event.key === "Delete") {
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
