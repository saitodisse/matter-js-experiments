/**
 * BodyFactory.ts
 * 
 * This file contains the BodyFactory class, responsible for creating different types of physical bodies
 * for the simulation using the Matter.js library. It provides methods to create circles, polygons,
 * rectangles, and random bodies with configurable physical and visual properties.
 */

import Matter from "matter-js";
import { BodyOptions } from "../types";
import { DebugControl } from "./DebugControl";

/**
 * BodyFactory Class
 * 
 * Responsible for creating different types of physical bodies in the simulation.
 * Uses the Matter.js library to create bodies and logs creation events
 * through DebugControl for debugging purposes.
 */
export class BodyFactory {
    // DebugControl instance for logging body creation events
    private debugControl: DebugControl;

    /**
     * BodyFactory constructor
     * 
     * @param debugControl - DebugControl instance for logging events
     */
    constructor(debugControl: DebugControl) {
        this.debugControl = debugControl;
    }

    /**
     * Creates a circular body
     * 
     * @param x - X position of the circle's center
     * @param y - Y position of the circle's center
     * @param radius - Radius of the circle
     * @param options - Additional options to configure the body (optional)
     * @returns Matter.js Body representing a circle
     */
    public createCircle(
        x: number,
        y: number,
        radius: number,
        options: BodyOptions = {},
    ): Matter.Body {
        // Create the circular body with specified physical and visual properties
        const body = Matter.Bodies.circle(x, y, radius, {
            // Define elasticity (how "bouncy" the body is)
            restitution: options.restitution || 0.9,
            // Define friction (resistance to movement when in contact with other bodies)
            friction: options.friction || 0.1,
            // Visual settings for the body
            render: {
                // Fill color (randomly chooses from shades of red if not specified)
                fillStyle: options.render?.fillStyle || Matter.Common.choose([
                    "#F44336",
                    "#E53935",
                    "#D32F2F",
                    "#C62828",
                    "#B71C1C",
                ]),
                // Border color
                strokeStyle: options.render?.strokeStyle || "#B71C1C",
                // Border line width
                lineWidth: options.render?.lineWidth || 1,
            },
        });

        // Log the circle creation event for debugging purposes
        this.debugControl.logEvent("Circle Created", {
            id: body.id,
            type: "Circle",
            position: { x: body.position.x, y: body.position.y },
            size: { radius: body.circleRadius },
        });

        return body;
    }

    /**
     * Creates a polygonal body
     * 
     * @param x - X position of the polygon's center
     * @param y - Y position of the polygon's center
     * @param sides - Number of sides of the polygon
     * @param radius - Radius of the polygon (distance from center to vertices)
     * @param options - Additional options to configure the body (optional)
     * @returns Matter.js Body representing a polygon
     */
    public createPolygon(
        x: number,
        y: number,
        sides: number,
        radius: number,
        options: BodyOptions = {},
    ): Matter.Body {
        // Create the polygonal body with specified physical and visual properties
        const body = Matter.Bodies.polygon(x, y, sides, radius, {
            // Define elasticity
            restitution: options.restitution || 0.9,
            // Define friction
            friction: options.friction || 0.1,
            // Visual settings for the body
            render: {
                // Fill color (randomly chooses from shades of green if not specified)
                fillStyle: options.render?.fillStyle || Matter.Common.choose([
                    "#4CAF50",
                    "#8BC34A",
                    "#66BB6A",
                    "#43A047",
                    "#388E3C",
                ]),
                // Border color
                strokeStyle: options.render?.strokeStyle || "#2E7D32",
                // Border line width
                lineWidth: options.render?.lineWidth || 2,
            },
        });

        // Log the polygon creation event for debugging purposes
        this.debugControl.logEvent("Polygon Created", {
            id: body.id,
            type: "Polygon",
            position: { x: body.position.x, y: body.position.y },
            size: { sides: body.vertices.length, radius: radius },
        });

        return body;
    }

    /**
     * Creates a rectangular body
     * 
     * @param x - X position of the rectangle's center
     * @param y - Y position of the rectangle's center
     * @param width - Width of the rectangle
     * @param height - Height of the rectangle
     * @param options - Additional options to configure the body (optional)
     * @returns Matter.js Body representing a rectangle
     */
    public createRectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        options: BodyOptions = {},
    ): Matter.Body {
        // Create the rectangular body with specified physical and visual properties
        const body = Matter.Bodies.rectangle(x, y, width, height, {
            // Define elasticity
            restitution: options.restitution || 0.9,
            // Define friction
            friction: options.friction || 0.1,
            // Visual settings for the body
            render: {
                // Fill color (randomly chooses from shades of blue if not specified)
                fillStyle: options.render?.fillStyle || Matter.Common.choose([
                    "#2196F3",
                    "#64B5F6",
                    "#42A5F5",
                    "#1E88E5",
                    "#1565C0",
                ]),
                // Border color
                strokeStyle: options.render?.strokeStyle || "#0D47A1",
                // Border line width
                lineWidth: options.render?.lineWidth || 2,
            },
        });

        // Log the rectangle creation event for debugging purposes
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

    /**
     * Creates a random body (circle, polygon, or rectangle)
     * 
     * @param x - X position of the body's center
     * @param y - Y position of the body's center
     * @returns Random Matter.js physical body
     */
    public createRandomBody(x: number, y: number): Matter.Body {
        // Generate a random number to determine the body type
        const type = Math.random();
        let body: Matter.Body;

        // Create a circle if the number is less than 0.33
        if (type < 0.33) {
            // Create a circle with random radius between 10 and 40
            body = this.createCircle(x, y, Matter.Common.random(10, 40));
        } 
        // Create a polygon if the number is between 0.33 and 0.66
        else if (type < 0.66) {
            // Determine a random number of sides between 3 and 8
            const sides = Math.floor(Matter.Common.random(3, 8));
            // Create a polygon with random radius between 20 and 50
            body = this.createPolygon(
                x,
                y,
                sides,
                Matter.Common.random(20, 50),
            );
        } 
        // Create a rectangle if the number is greater than 0.66
        else {
            // Determine random dimensions for the rectangle
            const width = Matter.Common.random(30, 80);
            const height = Matter.Common.random(30, 80);
            // Create a rectangle with the random dimensions
            body = this.createRectangle(x, y, width, height);
        }

        return body;
    }
}
