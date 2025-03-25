/**
 * BodyWrapper.ts
 * 
 * This file contains the BodyWrapper class, which provides functionality for wrapping
 * physics bodies around the edges of the simulation area, creating a "wrap-around" effect
 * similar to classic arcade games like Asteroids.
 */

import Matter from "matter-js";

/**
 * BodyWrapper Class
 * 
 * Handles the wrapping of physics bodies around the edges of the simulation area.
 * When a body moves beyond one edge of the defined bounds, it reappears from the
 * opposite edge, creating a continuous space effect.
 */
export class BodyWrapper {
    // The boundaries of the simulation area
    private bounds: {
        min: { x: number; y: number };  // Minimum x,y coordinates (top-left)
        max: { x: number; y: number };  // Maximum x,y coordinates (bottom-right)
    };

    /**
     * BodyWrapper constructor
     * 
     * @param bounds - The boundaries of the simulation area
     */
    constructor(
        bounds: {
            min: { x: number; y: number };
            max: { x: number; y: number };
        },
    ) {
        this.bounds = bounds;
    }

    /**
     * Wraps a physics body around the edges of the simulation area
     * 
     * If a body moves beyond one edge, this method repositions it to appear
     * from the opposite edge, maintaining its velocity and other properties.
     * 
     * @param body - The Matter.js body to wrap
     */
    public wrapBody(body: Matter.Body): void {
        // Handle wrapping along the x-axis (horizontal)
        if (body.position.x < this.bounds.min.x) {
            // If body moves beyond left edge, reposition to right edge
            Matter.Body.setPosition(body, {
                x: this.bounds.max.x - (this.bounds.min.x - body.position.x),
                y: body.position.y,
            });
        } else if (body.position.x > this.bounds.max.x) {
            // If body moves beyond right edge, reposition to left edge
            Matter.Body.setPosition(body, {
                x: this.bounds.min.x + (body.position.x - this.bounds.max.x),
                y: body.position.y,
            });
        }

        // Handle wrapping along the y-axis (vertical)
        if (body.position.y < this.bounds.min.y) {
            // If body moves beyond top edge, reposition to bottom edge
            Matter.Body.setPosition(body, {
                x: body.position.x,
                y: this.bounds.max.y - (this.bounds.min.y - body.position.y),
            });
        } else if (body.position.y > this.bounds.max.y) {
            // If body moves beyond bottom edge, reposition to top edge
            Matter.Body.setPosition(body, {
                x: body.position.x,
                y: this.bounds.min.y + (body.position.y - this.bounds.max.y),
            });
        }
    }

    /**
     * Updates the boundaries of the simulation area
     * 
     * This method is useful when the canvas is resized or the
     * simulation area changes for any reason.
     * 
     * @param bounds - The new boundaries of the simulation area
     */
    public setBounds(
        bounds: {
            min: { x: number; y: number };
            max: { x: number; y: number };
        },
    ): void {
        this.bounds = bounds;
    }
}
