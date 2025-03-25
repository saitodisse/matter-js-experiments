/**
 * DebugControl.ts
 *
 * This file contains the DebugControl class, which provides debugging functionality
 * for the Matter.js physics simulation. It adds a UI control to toggle debug mode
 * and manages debug-related settings and features.
 */

import Matter from "matter-js";

/**
 * DebugControl Class
 *
 * Manages debugging features for the physics simulation, including:
 * - A checkbox UI element to toggle debug mode
 * - Debug visualization options for the renderer
 * - Mouse interaction with physics objects when in debug mode
 * - Event logging functionality
 */
export class DebugControl {
    // UI elements
    private element: HTMLDivElement;
    private checkbox: HTMLInputElement;

    // Matter.js components
    private render: Matter.Render;
    private engine: Matter.Engine;
    private mouse: Matter.Mouse;
    private mouseConstraint: Matter.MouseConstraint;

    // State and callbacks
    private isDebugMode: boolean;
    private onChangeCallbacks: ((isDebugMode: boolean) => void)[] = [];

    /**
     * DebugControl constructor
     *
     * @param engine - The Matter.js engine instance
     * @param render - The Matter.js renderer instance
     */
    constructor(engine: Matter.Engine, render: Matter.Render) {
        this.engine = engine;
        this.render = render;

        // Load debug mode state from localStorage (persists between page refreshes)
        this.isDebugMode = localStorage.getItem("debugMode") === "true";

        // Create debug control UI element
        this.element = document.createElement("div");
        this.element.className = "debug-control";
        this.element.innerHTML = `
            <label>
                <input type="checkbox" id="debugMode">
            </label>
        `;
        document.body.appendChild(this.element);

        // Get checkbox element and set initial state
        this.checkbox = document.getElementById(
            "debugMode",
        ) as HTMLInputElement;
        this.checkbox.checked = this.isDebugMode;

        // Add event listener to handle checkbox changes
        this.checkbox.addEventListener("change", () => this.updateDebugMode());

        // Initialize debug mode settings
        this.updateDebugMode();
    }

    /**
     * Updates the debug mode settings based on the checkbox state
     *
     * This method is called when the debug checkbox is toggled and during initialization.
     * It updates renderer options, mouse interaction, and notifies registered callbacks.
     */
    private updateDebugMode(): void {
        this.isDebugMode = this.checkbox.checked;

        // Update renderer visualization options
        this.render.options.showAngleIndicator = this.isDebugMode;
        this.render.options.wireframes = this.isDebugMode;
        this.render.options.showDebug = this.isDebugMode;
        this.render.options.showCollisions = this.isDebugMode;
        this.render.options.showPositions = this.isDebugMode;
        this.render.options.showVelocity = this.isDebugMode;
        this.render.options.showIds = this.isDebugMode;

        // Handle mouse interaction based on debug mode
        if (this.isDebugMode) {
            // Create mouse and mouse constraint for interactive debugging
            this.mouse = Matter.Mouse.create(this.render.canvas);
            this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
                mouse: this.mouse,
                constraint: {
                    stiffness: 0.2, // How rigid the constraint is
                    render: {
                        visible: true, // Show the constraint when dragging
                    },
                },
            });

            // Add mouse constraint to the physics world
            Matter.Composite.add(this.engine.world, this.mouseConstraint);

            // Connect mouse to the renderer
            this.render.mouse = this.mouse;
        } else {
            // Remove mouse constraint from the physics world when debug mode is off
            if (this.mouseConstraint) {
                Matter.Composite.remove(
                    this.engine.world,
                    this.mouseConstraint,
                );
            }

            // Note: Commented out to prevent issues with other mouse interactions
            // this.render.mouse = undefined;
        }

        // Save debug mode state to localStorage for persistence
        localStorage.setItem("debugMode", String(this.isDebugMode));

        // Notify all registered callbacks about the debug mode change
        this.onChangeCallbacks.forEach((callback) =>
            callback(this.isDebugMode)
        );
    }

    /**
     * Checks if debug mode is currently enabled
     *
     * @returns True if debug mode is enabled, false otherwise
     */
    public isEnabled(): boolean {
        return this.isDebugMode;
    }

    /**
     * Registers a callback function to be called when debug mode changes
     *
     * @param callback - Function to call when debug mode changes
     */
    public onChange(callback: (isDebugMode: boolean) => void): void {
        this.onChangeCallbacks.push(callback);
    }

    /**
     * Logs an event to the console if debug mode is enabled
     *
     * @param eventName - Name of the event to log
     * @param data - Data associated with the event
     */
    public logEvent(eventName: string, data: any): void {
        if (this.isDebugMode) {
            console.log(eventName, data);
        }
    }
}
