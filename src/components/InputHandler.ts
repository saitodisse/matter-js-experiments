import Matter from "matter-js";
import { Engine } from "../core/Engine";
import { BodyFactory } from "./BodyFactory";
import { DebugControl } from "./DebugControl";

export class InputHandler {
    private engine: Engine;
    private bodyFactory: BodyFactory;
    private debugControl: DebugControl;
    private canvas: HTMLCanvasElement;
    private world: Matter.World;

    constructor(
        engine: Engine,
        bodyFactory: BodyFactory,
        debugControl: DebugControl,
    ) {
        this.engine = engine;
        this.bodyFactory = bodyFactory;
        this.debugControl = debugControl;
        this.canvas = engine.getCanvas();
        this.world = engine.getWorld();

        // Initialize event listeners
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Mouse down event
        this.canvas.addEventListener(
            "mousedown",
            (event) => this.handleMouseDown(event),
        );

        // Mouse up event
        this.canvas.addEventListener(
            "mouseup",
            (event) => this.handleMouseUp(event),
        );

        // Click event
        this.canvas.addEventListener(
            "click",
            (event) => this.handleClick(event),
        );

        // Context menu event (right click)
        this.canvas.addEventListener(
            "contextmenu",
            (event) => this.handleContextMenu(event),
        );

        // Mouse move event
        this.canvas.addEventListener(
            "mousemove",
            (event) => this.handleMouseMove(event),
        );

        // Keyboard events
        document.addEventListener(
            "keydown",
            (event) => this.handleKeyDown(event),
        );
    }

    private handleMouseDown(event: MouseEvent): void {
        this.debugControl.logEvent("Mouse Down", {
            x: event.clientX,
            y: event.clientY,
            button: event.button === 0
                ? "Left"
                : event.button === 1
                ? "Middle"
                : "Right",
        });

        if (event.button === 2) {
            const bodies = Matter.Query.point(this.world.bodies, {
                x: event.clientX,
                y: event.clientY,
            });

            this.debugControl.logEvent("Query Bodies", {
                bodies: bodies.map((body) => body.id),
            });

            for (const body of bodies) {
                if (!body.isStatic) {
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
                    this.engine.removeBody(body);
                }
            }
        }
    }

    private handleMouseUp(event: MouseEvent): void {
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

    private handleClick(event: MouseEvent): void {
        this.debugControl.logEvent("Click", {
            x: event.clientX,
            y: event.clientY,
            button: event.button === 0
                ? "Left"
                : event.button === 1
                ? "Middle"
                : "Right",
        });

        const mousePosition = {
            x: event.clientX,
            y: event.clientY,
        };

        const bodies = Matter.Query.point(this.world.bodies, mousePosition);

        if (bodies.length > 0) {
            const clickedBody = bodies.find((body) => !body.isStatic);

            if (clickedBody) {
                const direction = Matter.Vector.sub(
                    clickedBody.position,
                    mousePosition,
                );
                const normalizedDirection = Matter.Vector.normalise(direction);
                const distance = Matter.Vector.magnitude(direction);
                const force = Matter.Vector.mult(
                    normalizedDirection,
                    distance * 0.01,
                );

                Matter.Body.applyForce(
                    clickedBody,
                    clickedBody.position,
                    force,
                );

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
            }
        } else {
            if (event.ctrlKey) {
                const randomBody = this.bodyFactory.createRandomBody(
                    event.clientX,
                    event.clientY,
                );
                this.engine.addBody(randomBody);
            }
        }
    }

    private handleContextMenu(event: MouseEvent): void {
        event.preventDefault();
        this.debugControl.logEvent("Right Click - Object Removed", {
            x: event.clientX,
            y: event.clientY,
            button: "Right",
        });
    }

    private handleMouseMove(event: MouseEvent): void {
        if (event.buttons > 0) {
            const button = event.buttons === 1
                ? "Left"
                : event.buttons === 4
                ? "Middle"
                : "Right";

            this.debugControl.logEvent(`${button} Mouse Move (while pressed)`, {
                x: event.clientX,
                y: event.clientY,
                button: button,
            });

            if (button === "Right") {
                const bodies = Matter.Query.point(this.world.bodies, {
                    x: event.clientX,
                    y: event.clientY,
                });

                if (bodies.length > 0 && !bodies[0].isStatic) {
                    this.engine.removeBody(bodies[0]);
                }
            }

            if (button === "Left" && event.ctrlKey) {
                const currentTime = Date.now();
                if (
                    !window.lastCreationTime ||
                    currentTime - window.lastCreationTime >= 100
                ) {
                    const randomBody = this.bodyFactory.createRandomBody(
                        event.clientX,
                        event.clientY,
                    );
                    this.engine.addBody(randomBody);
                    window.lastCreationTime = currentTime;
                }
            }
        }

        // // Apply repulsion force to bodies near the mouse
        // const mousePosition = { x: event.clientX, y: event.clientY };
        // const repulsionDistance = 150;
        // const repulsionStrength = 0.05;

        // for (const body of this.engine.getAllBodies()) {
        //     const distance = Matter.Vector.magnitude(
        //         Matter.Vector.sub(body.position, mousePosition),
        //     );

        //     if (distance < repulsionDistance) {
        //         const direction = Matter.Vector.normalise(
        //             Matter.Vector.sub(body.position, mousePosition),
        //         );
        //         const force = Matter.Vector.mult(direction, repulsionStrength);
        //         Matter.Body.applyForce(body, body.position, force);
        //     }
        // }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === "Delete") {
            const bodies = this.engine.getAllBodies();
            for (const body of bodies) {
                if (!body.isStatic) {
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
                    this.engine.removeBody(body);
                    break;
                }
            }
        }
    }
}
