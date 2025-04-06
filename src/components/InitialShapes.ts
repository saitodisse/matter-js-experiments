/**
 * InitialShapes.ts
 *
 * This file contains the InitialShapes class, which creates a set of initial shapes
 * in the physics simulation. These shapes serve as starting objects for the user to interact with.
 */

import Matter from "matter-js";
import { Engine } from "../core/Engine";
import { BoundaryBox } from "./BoundaryBox"; // Import BoundaryBox
import { DebugControl } from "./DebugControl";
import { BodyFactory } from "./BodyFactory";
/**
 * InitialShapes Class
 *
 * Creates and manages a set of initial physics bodies with different shapes
 * (triangle, pentagon, rectangle) that are added to the simulation at startup.
 */
export class InitialShapes {
  // Reference to the physics engine
  private engine: Engine;
  // Array to store the shape bodies
  private shapes: Matter.Body[] = [];
  // Reference to the boundary box
  private boundaryBox: BoundaryBox;
  private bodyFactory: BodyFactory;
  private debugControl: DebugControl;

  /**
   * InitialShapes constructor
   *
   * @param engine - Reference to the physics engine
   * @param boundaryBox - Reference to the boundary box instance
   */
  constructor({
    engine,
    boundaryBox,
    bodyFactory,
    debugControl,
  }: {
    engine: Engine;
    boundaryBox: BoundaryBox;
    bodyFactory: BodyFactory;
    debugControl: DebugControl;
  }) {
    // Add boundaryBox parameter
    this.engine = engine;
    this.boundaryBox = boundaryBox; // Store boundaryBox reference
    this.bodyFactory = bodyFactory;
    this.debugControl = debugControl;
    this.createShapes();
  }

  /**
   * Creates the initial set of shapes
   *
   * This method creates three different shapes (triangle, pentagon, rectangle)
   * with specific properties and adds them to the physics simulation.
   */
  private createShapes(): void {
    const screenWidth = this.engine.getRender().options.width ??
      window.innerWidth;
    const screenHeight = this.engine.getRender().options.height ??
      window.innerHeight;
    const boxBounds = this.boundaryBox.getBounds();
    const safeDistance = 30; // Minimum distance from the box edges

    // Helper function to generate a safe random position
    const generateSafePosition = (
      shapeRadius: number,
    ): { x: number; y: number } => {
      let x: number;
      let y: number;
      let isSafe: boolean;
      const padding = shapeRadius + 10; // Padding from screen edges

      let maxCounter = 0;

      do {
        maxCounter++;

        if (maxCounter > 100) {
          throw new Error(
            `generateSafePosition cannot place new object. Try to make window bigger.`,
          );
        }

        // Generate random position within screen bounds (with padding)
        x = Math.random() * (screenWidth - 2 * padding) + padding;
        y = Math.random() * (screenHeight - 2 * padding) + padding;

        // Define the horizontal exclusion zones around the box
        const exclusionZoneMinX = boxBounds.min.x - safeDistance;
        const exclusionZoneMaxX = boxBounds.max.x + safeDistance;

        // Check if the point falls within the combined exclusion zone
        const isHorizontallyUnsafe = x >= exclusionZoneMinX &&
          x <= exclusionZoneMaxX;

        // The position is unsafe ONLY if it's within BOTH the horizontal AND vertical exclusion zones
        const isUnsafe = isHorizontallyUnsafe;

        this.debugControl.logEvent("generateSafePosition", {
          shapeRadius,
          x,
          y,
          boxBounds,
          safeDistance,
          exclusionZoneMinX,
          exclusionZoneMaxX,
          isHorizontallyUnsafe,
          isUnsafe,
        });

        // isSafe is the opposite of isUnsafe
        isSafe = !isUnsafe;
      } while (!isSafe); // Keep trying until a safe position is found

      return { x, y };
    };

    // --- Create shapes with random safe positions ---
    const shapeRadiusEstimate = 60; // Estimate for padding/distance checks

    // Create shape at a random safe position
    function createNewShape(bodyFactory: BodyFactory) {
      const bodyPos = generateSafePosition(shapeRadiusEstimate);
      const body = bodyFactory.createRandomBody(bodyPos.x, bodyPos.y);
      return body;
    }

    // Store all shapes in the array
    this.shapes = [
      createNewShape(this.bodyFactory),
      createNewShape(this.bodyFactory),
      createNewShape(this.bodyFactory),
    ];
    // Add all shapes to the physics engine
    this.engine.addBody(this.shapes);
    // The check for shapes falling in immediately will happen after a delay in main.ts
  }

  /**
   * Returns all shape bodies
   *
   * @returns Array of Matter.js bodies representing the shapes
   */
  public getShapes(): Matter.Body[] {
    return this.shapes;
  }
}
