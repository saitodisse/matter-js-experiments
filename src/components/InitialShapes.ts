import * as Matter from "matter-js";
import { Engine } from "../core/Engine";

export class InitialShapes {
    private engine: Engine;
    private shapes: Matter.Body[] = [];

    constructor(engine: Engine) {
        this.engine = engine;
        this.createShapes();
    }

    private createShapes(): void {
        // Triangle
        const triangle = Matter.Bodies.polygon(200, 460, 3, 60, {
            restitution: 0.9,
            friction: 0.1,
            render: {
                fillStyle: "#4CAF50",
                strokeStyle: "#388E3C",
                lineWidth: 2,
            },
        });

        // Pentagon
        const pentagon = Matter.Bodies.polygon(400, 460, 5, 60, {
            restitution: 0.9,
            friction: 0.1,
            render: {
                fillStyle: "#2196F3",
                strokeStyle: "#1976D2",
                lineWidth: 2,
            },
        });

        // Rectangle
        const rectangle = Matter.Bodies.rectangle(600, 460, 80, 80, {
            restitution: 0.9,
            friction: 0.1,
            render: {
                fillStyle: "#FFC107",
                strokeStyle: "#FF8F00",
                lineWidth: 2,
            },
        });

        this.shapes = [triangle, pentagon, rectangle];
        this.engine.addBody(this.shapes);
    }

    public getShapes(): Matter.Body[] {
        return this.shapes;
    }
}
