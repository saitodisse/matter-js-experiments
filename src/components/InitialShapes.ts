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
  private roundNumber: number; // Add round number property

  /**
   * InitialShapes constructor
   *
   * @param engine - Reference to the physics engine
   * @param boundaryBox - Reference to the boundary box instance
   * @param bodyFactory - Factory for creating bodies
   * @param debugControl - Debug control instance
   * @param roundNumber - The current round number
   */
  constructor({
    engine,
    boundaryBox,
    bodyFactory,
    debugControl,
    roundNumber, // Add roundNumber to parameters
  }: {
    engine: Engine;
    boundaryBox: BoundaryBox;
    bodyFactory: BodyFactory;
    debugControl: DebugControl;
    roundNumber: number; // Add type for roundNumber
  }) {
    // Add boundaryBox parameter
    this.engine = engine;
    this.boundaryBox = boundaryBox; // Store boundaryBox reference
    this.bodyFactory = bodyFactory;
    this.debugControl = debugControl;
    this.roundNumber = roundNumber; // Store round number
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

    // --- Create shapes based on round number ---
    const shapeRadiusEstimate = 60; // Estimate for padding/distance checks
    const shapesToCreate: Matter.Body[] = [];

    this.debugControl.logEvent("LevelSetup", {
      round: this.roundNumber,
      message: `Setting up shapes for round ${this.roundNumber}`,
    });

    switch (this.roundNumber) {
      case 1:
        // Level 1: One square
        const pos1 = generateSafePosition(shapeRadiusEstimate);
        shapesToCreate.push(
          this.bodyFactory.createRectangle(pos1.x, pos1.y, 50, 50),
        ); // Example size
        break;
      case 2:
        // Level 2: One square, one hexagon
        const pos2a = generateSafePosition(shapeRadiusEstimate);
        shapesToCreate.push(
          this.bodyFactory.createRectangle(pos2a.x, pos2a.y, 50, 50),
        );
        const pos2b = generateSafePosition(shapeRadiusEstimate);
        shapesToCreate.push(
          this.bodyFactory.createPolygon(pos2b.x, pos2b.y, 6, 40),
        ); // Example size
        break;
      case 3:
        // Level 3: 3 random shapes
        for (let i = 0; i < 3; i++) {
          const pos = generateSafePosition(shapeRadiusEstimate);
          shapesToCreate.push(this.bodyFactory.createRandomBody(pos.x, pos.y));
        }
        break;
      case 4:
        // Level 4: 4 random shapes
        for (let i = 0; i < 4; i++) {
          const pos = generateSafePosition(shapeRadiusEstimate);
          shapesToCreate.push(this.bodyFactory.createRandomBody(pos.x, pos.y));
        }
        break;
      default:
        // Level 5 and beyond: 5 random shapes
        for (let i = 0; i < 5; i++) {
          const pos = generateSafePosition(shapeRadiusEstimate);
          shapesToCreate.push(this.bodyFactory.createRandomBody(pos.x, pos.y));
        }
        break;
    }

    // Store all created shapes in the array
    this.shapes = shapesToCreate;
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
