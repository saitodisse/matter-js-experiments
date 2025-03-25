import * as Matter from "matter-js";

export class BodyWrapper {
    private bounds: { min: { x: number, y: number }, max: { x: number, y: number } };

    constructor(bounds: { min: { x: number, y: number }, max: { x: number, y: number } }) {
        this.bounds = bounds;
    }

    public wrapBody(body: Matter.Body): void {
        if (body.position.x < this.bounds.min.x) {
            Matter.Body.setPosition(body, {
                x: this.bounds.max.x - (this.bounds.min.x - body.position.x),
                y: body.position.y,
            });
        } else if (body.position.x > this.bounds.max.x) {
            Matter.Body.setPosition(body, {
                x: this.bounds.min.x + (body.position.x - this.bounds.max.x),
                y: body.position.y,
            });
        }

        if (body.position.y < this.bounds.min.y) {
            Matter.Body.setPosition(body, {
                x: body.position.x,
                y: this.bounds.max.y - (this.bounds.min.y - body.position.y),
            });
        } else if (body.position.y > this.bounds.max.y) {
            Matter.Body.setPosition(body, {
                x: body.position.x,
                y: this.bounds.min.y + (body.position.y - this.bounds.max.y),
            });
        }
    }

    public setBounds(bounds: { min: { x: number, y: number }, max: { x: number, y: number } }): void {
        this.bounds = bounds;
    }
}
