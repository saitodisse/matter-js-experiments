import * as Matter from "matter-js";

// Extend the Window interface to include our custom property
interface Window {
    lastCreationTime?: number;
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
