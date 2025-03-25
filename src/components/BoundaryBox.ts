import Matter from "matter-js";
import { Engine } from "../core/Engine";

export class BoundaryBox {
    private engine: Engine;
    private boxParts: Matter.Body[] = [];
    private width: number;
    private height: number;

    constructor(engine: Engine, width: number, height: number) {
        this.engine = engine;
        this.width = width;
        this.height = height;
        this.createBoxParts();
    }

    private createBoxParts(): void {
        const BoxA_width = 180;
        const BoxA_height = 140;
        const BoxA_x_position = this.width - (50.5 / 1.2 + BoxA_width / 2);
        const BoxA_y_position = this.height - (50.5 / 1.2 + BoxA_height / 2);

        console.log(
            "BoxA",
            {
                width: this.width,
                height: this.height,
                BoxA_x_position,
                BoxA_y_position,
                BoxA_width,
                BoxA_height,
            },
        );

        // Bottom box
        const bottomBox = Matter.Bodies.rectangle(
            BoxA_x_position,
            BoxA_y_position + BoxA_height / 2,
            BoxA_width,
            2,
            {
                isStatic: true,
                render: {
                    fillStyle: "#060a19",
                    strokeStyle: "#000",
                    lineWidth: 2,
                },
            },
        );

        // Left box
        const leftBox = Matter.Bodies.rectangle(
            BoxA_x_position - BoxA_width / 2,
            BoxA_y_position,
            2,
            BoxA_height,
            {
                isStatic: true,
                render: {
                    fillStyle: "#060a19",
                    strokeStyle: "#000",
                    lineWidth: 2,
                },
            },
        );

        // Right box
        const rightBox = Matter.Bodies.rectangle(
            BoxA_x_position + BoxA_width / 2,
            BoxA_y_position,
            2,
            BoxA_height,
            {
                isStatic: true,
                render: {
                    fillStyle: "#060a19",
                    strokeStyle: "#000",
                    lineWidth: 2,
                },
            },
        );

        this.boxParts.push(bottomBox, leftBox, rightBox);

        this.engine.addBody(this.boxParts);
    }

    public getBoxs(): Matter.Body[] {
        return this.boxParts;
    }

    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        // Remove old boxs
        for (const box of this.boxParts) {
            this.engine.removeBody(box);
        }

        // Create new boxs
        this.createBoxParts();
    }
}
