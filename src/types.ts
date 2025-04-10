import * as Matter from "matter-js";

// Augment the global Window interface to include our custom property
declare global {
    interface Window {
        lastCreationTime?: number;
    }
}

export interface SimulationOptions {
    element: HTMLElement;
    width: number;
    height: number;
    showAngleIndicator?: boolean;
    background?: string;
    wireframes?: boolean;
}

export interface BodyOptions {
    restitution?: number;
    friction?: number;
    render?: {
        fillStyle?: string;
        strokeStyle?: string;
        lineWidth?: number;
    };
}

export interface SimulationInstance {
    engine: Matter.Engine;
    runner: Matter.Runner;
    render: Matter.Render;
    canvas: HTMLCanvasElement;
    stop: () => void;
}

// Collision Categories
export const CATEGORY_GAME_SHAPE = 0x0001;
export const CATEGORY_WALL = 0x0002;
export const CATEGORY_EFFECT_PARTICLE = 0x0004;
