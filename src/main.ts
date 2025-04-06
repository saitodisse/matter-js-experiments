/**
 * main.ts
 *
 * This is the entry point of the application. It creates and initializes the physics
 * simulation, sets up all necessary components, and starts the animation loop.
 */

import "./style.css";
import { BallPoolSimulation } from "./core/BallPoolSimulation";

// Initialize and start the simulation when the window loads
window.onload = function () {
  try {
    const simulation = new BallPoolSimulation();
    simulation.start();
  } catch (error: any) {
    const gameInfoContainer = document.body;

    gameInfoContainer.innerHTML = `<div style='
    color: #bb3c3c;
    border: 1px solid;
    padding: 10px;
'>ERROR<br /><br />${error.message}
<pre style='
    font-size: 10px;
    white-space: pre;
    text-align: left;
    max-width: 90vw;
    overflow: auto;
'>${error.stack}</pre>
</div>
`;
    throw error;
  }
};
