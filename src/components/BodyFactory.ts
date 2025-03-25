import Matter from "matter-js";
import { BodyOptions } from "../types";
import { DebugControl } from "./DebugControl";

export class BodyFactory {
    private debugControl: DebugControl;

    constructor(debugControl: DebugControl) {
        this.debugControl = debugControl;
    }

    public createCircle(
        x: number,
        y: number,
        radius: number,
        options: BodyOptions = {},
    ): Matter.Body {
        const body = Matter.Bodies.circle(x, y, radius, {
            restitution: options.restitution || 0.9,
            friction: options.friction || 0.1,
            render: {
                fillStyle: options.render?.fillStyle || Matter.Common.choose([
                    "#F44336",
                    "#E53935",
                    "#D32F2F",
                    "#C62828",
                    "#B71C1C",
                ]),
                strokeStyle: options.render?.strokeStyle || "#B71C1C",
                lineWidth: options.render?.lineWidth || 1,
            },
        });

        this.debugControl.logEvent("Circle Created", {
            id: body.id,
            type: "Circle",
            position: { x: body.position.x, y: body.position.y },
            size: { radius: body.circleRadius },
        });

        return body;
    }

    public createPolygon(
        x: number,
        y: number,
        sides: number,
        radius: number,
        options: BodyOptions = {},
    ): Matter.Body {
        const body = Matter.Bodies.polygon(x, y, sides, radius, {
            restitution: options.restitution || 0.9,
            friction: options.friction || 0.1,
            render: {
                fillStyle: options.render?.fillStyle || Matter.Common.choose([
                    "#4CAF50",
                    "#8BC34A",
                    "#66BB6A",
                    "#43A047",
                    "#388E3C",
                ]),
                strokeStyle: options.render?.strokeStyle || "#2E7D32",
                lineWidth: options.render?.lineWidth || 2,
            },
        });

        this.debugControl.logEvent("Polygon Created", {
            id: body.id,
            type: "Polygon",
            position: { x: body.position.x, y: body.position.y },
            size: { sides: body.vertices.length, radius: radius },
        });

        return body;
    }

    public createRectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        options: BodyOptions = {},
    ): Matter.Body {
        const body = Matter.Bodies.rectangle(x, y, width, height, {
            restitution: options.restitution || 0.9,
            friction: options.friction || 0.1,
            render: {
                fillStyle: options.render?.fillStyle || Matter.Common.choose([
                    "#2196F3",
                    "#64B5F6",
                    "#42A5F5",
                    "#1E88E5",
                    "#1565C0",
                ]),
                strokeStyle: options.render?.strokeStyle || "#0D47A1",
                lineWidth: options.render?.lineWidth || 2,
            },
        });

        this.debugControl.logEvent("Rectangle Created", {
            id: body.id,
            type: "Rectangle",
            position: { x: body.position.x, y: body.position.y },
            size: {
                width: body.bounds.max.x - body.bounds.min.x,
                height: body.bounds.max.y - body.bounds.min.y,
            },
        });

        return body;
    }

    public createRandomBody(x: number, y: number): Matter.Body {
        const type = Math.random();
        let body: Matter.Body;

        if (type < 0.33) {
            body = this.createCircle(x, y, Matter.Common.random(10, 40));
        } else if (type < 0.66) {
            const sides = Math.floor(Matter.Common.random(3, 8));
            body = this.createPolygon(
                x,
                y,
                sides,
                Matter.Common.random(20, 50),
            );
        } else {
            const width = Matter.Common.random(30, 80);
            const height = Matter.Common.random(30, 80);
            body = this.createRectangle(x, y, width, height);
        }

        return body;
    }
}
