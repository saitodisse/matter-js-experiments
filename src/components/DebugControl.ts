import Matter from "matter-js";

export class DebugControl {
    private element: HTMLDivElement;
    private checkbox: HTMLInputElement;
    private render: Matter.Render;
    private isDebugMode: boolean;
    private onChangeCallbacks: ((isDebugMode: boolean) => void)[] = [];

    constructor(render: Matter.Render) {
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
