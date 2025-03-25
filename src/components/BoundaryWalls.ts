import Matter from "matter-js";
import { Engine } from "../core/Engine";

export class BoundaryWalls {
    private engine: Engine;
    private walls: Matter.Body[] = [];
    private width: number;
    private height: number;

    constructor(engine: Engine, width: number, height: number) {
        this.engine = engine;
        this.width = width;
        this.height = height;
        this.createWalls();
    }

    private createWalls(): void {
        // Bottom wall
        const bottomWall = Matter.Bodies.rectangle(
            this.width / 2,
            this.height,
            this.width,
            50.5,
            {
                isStatic: true,
                render: {
                    fillStyle: "#060a19",
                    strokeStyle: "#000",
                    lineWidth: 2,
                },
            },
        );

        // Left wall
        const leftWall = Matter.Bodies.rectangle(
            0,
            this.height / 2,
            50.5,
            this.height,
            {
                isStatic: true,
                render: {
                    fillStyle: "#060a19",
                    strokeStyle: "#000",
                    lineWidth: 2,
                },
            },
        );

        // Right wall
        const rightWall = Matter.Bodies.rectangle(
            this.width,
            this.height / 2,
            50.5,
            this.height,
            {
                isStatic: true,
                render: {
                    fillStyle: "#060a19",
                    strokeStyle: "#000",
                    lineWidth: 2,
                },
            },
        );

        this.walls = [bottomWall, leftWall, rightWall];
        this.engine.addBody(this.walls);
    }

    public getWalls(): Matter.Body[] {
        return this.walls;
    }

    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        // Remove old walls
        for (const wall of this.walls) {
            this.engine.removeBody(wall);
        }

        // Create new walls
        this.createWalls();
    }
}
