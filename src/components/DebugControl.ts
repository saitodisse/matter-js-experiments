import Matter from "matter-js";

export class DebugControl {
    private element: HTMLDivElement;
    private checkbox: HTMLInputElement;
    private render: Matter.Render;
    private engine: Matter.Engine;
    private isDebugMode: boolean;
    private onChangeCallbacks: ((isDebugMode: boolean) => void)[] = [];
    private mouse: Matter.Mouse;
    private mouseConstraint: Matter.MouseConstraint;

    constructor(engine: Matter.Engine, render: Matter.Render) {
        this.engine = engine;
        this.render = render;
        this.isDebugMode = localStorage.getItem("debugMode") === "true";

        // Create debug control element
        this.element = document.createElement("div");
        this.element.className = "debug-control";
        this.element.innerHTML = `
            <label>
                <input type="checkbox" id="debugMode">
                Debug Mode
            </label>
        `;
        document.body.appendChild(this.element);

        // Get checkbox element
        this.checkbox = document.getElementById(
            "debugMode",
        ) as HTMLInputElement;
        this.checkbox.checked = this.isDebugMode;

        // Add event listener
        this.checkbox.addEventListener("change", () => this.updateDebugMode());

        // Initial update
        this.updateDebugMode();
    }

    private updateDebugMode(): void {
        this.isDebugMode = this.checkbox.checked;

        // Update render options
        this.render.options.showAngleIndicator = this.isDebugMode;
        this.render.options.wireframes = this.isDebugMode;
        this.render.options.showDebug = this.isDebugMode;
        this.render.options.showCollisions = this.isDebugMode;
        this.render.options.showPositions = this.isDebugMode;
        this.render.options.showVelocity = this.isDebugMode;

        // add mouse control
        if (this.isDebugMode) {
            // Create mouse and mouse constraint
            this.mouse = Matter.Mouse.create(this.render.canvas);
            this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
                mouse: this.mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: true,
                    },
                },
            });

            // Add mouse constraint to world
            Matter.Composite.add(this.engine.world, this.mouseConstraint);

            // Set mouse in render
            this.render.mouse = this.mouse;
        } else {
            // Remove mouse constraint from world
            if (this.mouseConstraint) {
                Matter.Composite.remove(
                    this.engine.world,
                    this.mouseConstraint,
                );
            }

            // Remove mouse from render
            // this.render.mouse = undefined;
        }

        // Save to localStorage
        localStorage.setItem("debugMode", String(this.isDebugMode));

        // Call all registered callbacks
        this.onChangeCallbacks.forEach((callback) =>
            callback(this.isDebugMode)
        );
    }

    public isEnabled(): boolean {
        return this.isDebugMode;
    }

    public onChange(callback: (isDebugMode: boolean) => void): void {
        this.onChangeCallbacks.push(callback);
    }

    public logEvent(eventName: string, data: any): void {
        if (this.isDebugMode) {
            console.log(eventName, data);
        }
    }
}
