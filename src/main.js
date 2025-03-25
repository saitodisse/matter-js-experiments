import './style.css';
import * as Matter from 'matter-js';

var Example = Example || {};

Example.ballPool = function () {
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composite = Matter.Composite,
        Composites = Matter.Composites,
        Common = Matter.Common,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Bodies = Matter.Bodies,
        Vector = Matter.Vector, 
        Query = Matter.Query;    

    var engine = Engine.create(),
        world = engine.world;

    var render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            showAngleIndicator: false,
            background: '#F0F0F0',
            wireframes: false
        }
    });

    const debugControl = document.createElement('div');
    debugControl.className = 'debug-control';
    debugControl.innerHTML = `
        <label>
            <input type="checkbox" id="debugMode">
            Debug Mode
        </label>
    `;
    document.body.appendChild(debugControl);

    const debugCheckbox = document.getElementById('debugMode');
    debugCheckbox.checked = localStorage.getItem('debugMode') === 'true';

    function updateDebugMode() {
        render.options.showAngleIndicator = debugCheckbox.checked;
        render.options.wireframes = debugCheckbox.checked;
        localStorage.setItem('debugMode', debugCheckbox.checked);

        const handlers = {
            mousedown: function (event) {
                const button = event.button === 0 ? 'Left' : event.button === 1 ? 'Middle' : 'Right';
                console.log(`${button} Mouse Down:`, {
                    x: event.clientX,
                    y: event.clientY,
                    button: button
                });
            },
            mouseup: function (event) {
                const button = event.button === 0 ? 'Left' : event.button === 1 ? 'Middle' : 'Right';
                console.log(`${button} Mouse Up:`, {
                    x: event.clientX,
                    y: event.clientY,
                    button: button
                });
            },
            click: function (event) {
                const button = event.button === 0 ? 'Left' : event.button === 1 ? 'Middle' : 'Right';
                console.log(`${button} Click - Object Created:`, {
                    x: event.clientX,
                    y: event.clientY,
                    button: button
                });
            },
            contextmenu: function (event) {
                console.log('Right Click - Object Removed:', {
                    x: event.clientX,
                    y: event.clientY,
                    button: 'Right'
                });
            },
            mousemove: function (event) {
                if (event.buttons > 0) {
                    const button = event.buttons === 1 ? 'Left' : event.buttons === 4 ? 'Middle' : 'Right';

                    if (debugCheckbox.checked) {
                        console.log(`${button} Mouse Move (while pressed):`, {
                            x: event.clientX,
                            y: event.clientY,
                            button: button
                        });
                    }

                    if (button === 'Right') {
                        var bodies = Query.point(world.bodies, {
                            x: event.clientX,
                            y: event.clientY
                        });
                        if (bodies.length > 0 && !bodies[0].isStatic) {
                            Composite.remove(world, bodies[0])
                        }
                    }

                    if (button === 'Left' && event.ctrlKey) {
                        const currentTime = Date.now();
                        if (!window.lastCreationTime || currentTime - window.lastCreationTime >= 100) {
                            var randomBody = createRandomBody(event.clientX, event.clientY);
                            Composite.add(world, randomBody);
                            window.lastCreationTime = currentTime;
                        }
                    }
                }
            }
        };

        render.canvas.addEventListener('mousedown', handlers.mousedown);
        render.canvas.addEventListener('mouseup', handlers.mouseup);
        render.canvas.addEventListener('click', handlers.click);
        render.canvas.addEventListener('contextmenu', handlers.contextmenu);
        render.canvas.addEventListener('mousemove', handlers.mousemove);
    }

    updateDebugMode();

    debugCheckbox.addEventListener('change', updateDebugMode);

    Render.run(render);

    var runner = Runner.create();
    Runner.run(runner, engine);

    Composite.add(world, [
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 50.5, { 
            isStatic: true,
            render: {
                fillStyle: '#060a19',
                strokeStyle: '#000',
                lineWidth: 2
            }
        }),
        Bodies.rectangle(0, window.innerHeight / 2, 50.5, window.innerHeight, { 
            isStatic: true,
            render: {
                fillStyle: '#060a19',
                strokeStyle: '#000',
                lineWidth: 2
            }
        }),
        Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 50.5, window.innerHeight, { 
            isStatic: true,
            render: {
                fillStyle: '#060a19',
                strokeStyle: '#000',
                lineWidth: 2
            }
        })
    ]);

    Composite.add(world, [
        Bodies.polygon(200, 460, 3, 60, {
            restitution: 0.9, 
            friction: 0.1,
            render: { fillStyle: '#4CAF50', strokeStyle: '#388E3C', lineWidth: 2 }
        }),
        Bodies.polygon(400, 460, 5, 60, {
            restitution: 0.9, 
            friction: 0.1,
            render: { fillStyle: '#2196F3', strokeStyle: '#1976D2', lineWidth: 2 }
        }),
        Bodies.rectangle(600, 460, 80, 80, {
            restitution: 0.9, 
            friction: 0.1,
            render: { fillStyle: '#FFC107', strokeStyle: '#FF8F00', lineWidth: 2 }
        })
    ]);

    var mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

    Composite.add(world, mouseConstraint);

    render.mouse = mouse;

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Delete') {
            var bodies = Composite.allBodies(world);
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                if (!body.isStatic) {
                    if (debugCheckbox.checked) {
                        console.log('Object Removed (DEL key):', {
                            id: body.id,
                            type: body.circleRadius ? 'Circle' :
                                body.vertices ? 'Polygon' : 'Rectangle',
                            position: { x: body.position.x, y: body.position.y }
                        });
                    }
                    Composite.remove(world, body);
                    break; 
                }
            }
        }
    });

    render.canvas.addEventListener('mousedown', function (event) {
        if (debugCheckbox.checked) {
            console.log('mousedown', {
                x: event.clientX,
                y: event.clientY,
                button: event.button
            });
        }
        if (event.button === 2) { 
            mouseConstraint.enabled = false;

            var mousePosition = Mouse.create(render.canvas).position;

            var bodies = Query.point(world.bodies, {
                x: event.clientX,
                y: event.clientY
            });

            if (debugCheckbox.checked) {
                console.log('world.bodies', world.bodies)
                console.log(`mousedown: ${event.clientX}, ${event.clientY} bodies id: ${bodies.map(body => body.id)}`, bodies);
            }

            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                if (!body.isStatic) { 
                    if (debugCheckbox.checked) {
                        console.log('Object Removed:', {
                            id: body.id,
                            type: body.circleRadius ? 'Circle' :
                                body.vertices ? 'Polygon' : 'Rectangle',
                            position: { x: body.position.x, y: body.position.y }
                        });
                    }
                    Composite.remove(world, body);
                }
            }

            setTimeout(() => {
                mouseConstraint.enabled = true;
            }, 100);
        }
    }, true);

    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: window.innerWidth, y: window.innerHeight }
    });

    var allBodies = Composite.allBodies(world);
    for (var i = 0; i < allBodies.length; i += 1) {
        allBodies[i].plugin = {};
        allBodies[i].plugin.wrap = {
            min: { x: -100, y: 0 },
            max: { x: window.innerWidth + 100, y: window.innerHeight }
        };
    }

    function wrap(body, bounds) {
        if (body.position.x < bounds.min.x) {
            Matter.Body.setPosition(body, { x: bounds.max.x - (bounds.min.x - body.position.x), y: body.position.y });
        } else if (body.position.x > bounds.max.x) {
            Matter.Body.setPosition(body, { x: bounds.min.x + (body.position.x - bounds.max.x), y: body.position.y });
        }

        if (body.position.y < bounds.min.y) {
            Matter.Body.setPosition(body, { x: body.position.x, y: bounds.max.y - (bounds.min.y - body.position.y) });
        } else if (body.position.y > bounds.max.y) {
            Matter.Body.setPosition(body, { x: body.position.x, y: bounds.min.y + (body.position.y - bounds.max.y) });
        }
    };

    Matter.Events.on(engine, 'beforeUpdate', function () {
        var bounds = render.bounds;
        for (var i = 0; i < allBodies.length; i++) {
            wrap(allBodies[i], bounds);
        }
    });

    render.canvas.addEventListener('mousemove', function (event) {
        var mousePosition = Mouse.create(render.canvas).position;
        var repulsionDistance = 150;  
        var repulsionStrength = 0.05; 

        for (var i = 0; i < allBodies.length; i++) {
            var body = allBodies[i];
            var distance = Vector.magnitude(Vector.sub(body.position, mousePosition));

            if (distance < repulsionDistance) {
                var direction = Vector.normalise(Vector.sub(body.position, mousePosition));
                var force = Vector.mult(direction, repulsionStrength);
                Matter.Body.applyForce(body, body.position, force);
            }
        }
    });

    function createRandomBody(x, y) {
        var type = Math.random();
        var body;

        if (type < 0.33) { 
            body = Bodies.circle(x, y, Common.random(10, 40), {
                restitution: 0.9,
                friction: 0.1,
                render: {
                    fillStyle: Common.choose(['#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C']),
                    strokeStyle: '#B71C1C',
                    lineWidth: 1
                }
            });
        } else if (type < 0.66) { 
            var sides = Math.floor(Common.random(3, 8));
            body = Bodies.polygon(x, y, sides, Common.random(20, 50), {
                restitution: 0.9,
                friction: 0.1,
                render: {
                    fillStyle: Common.choose(['#4CAF50', '#8BC34A', '#66BB6A', '#43A047', '#388E3C']),
                    strokeStyle: '#2E7D32',
                    lineWidth: 2
                }
            });
        } else { 
            var width = Common.random(30, 80);
            var height = Common.random(30, 80);
            body = Bodies.rectangle(x, y, width, height, {
                restitution: 0.9,
                friction: 0.1,
                render: {
                    fillStyle: Common.choose(['#2196F3', '#64B5F6', '#42A5F5', '#1E88E5', '#1565C0']),
                    strokeStyle: '#0D47A1',
                    lineWidth: 2
                }
            });
        }

        if (debugCheckbox.checked) {
            console.log('Object Created:', {
                id: body.id,
                type: type < 0.33 ? 'Circle' : type < 0.66 ? 'Polygon' : 'Rectangle',
                position: { x: body.position.x, y: body.position.y },
                size: type < 0.33 ? { radius: body.circleRadius } :
                    type < 0.66 ? { sides: body.vertices.length, radius: body.radius } :
                        { width: body.width, height: body.height }
            });
        }

        return body;
    }

    render.canvas.addEventListener('click', function (event) {
        var mousePosition = {
            x: event.clientX,
            y: event.clientY
        };

        var bodies = Query.point(world.bodies, {
            x: event.clientX,
            y: event.clientY
        });

        if (bodies.length > 0) {
            var clickedBody = bodies.find(body => !body.isStatic);

            if (clickedBody) {
                var direction = Vector.sub(clickedBody.position, mousePosition);
                direction = Vector.normalise(direction);

                var distance = Vector.magnitude(Vector.sub(clickedBody.position, mousePosition));

                var force = Vector.mult(direction, distance * 0.01); 

                Matter.Body.applyForce(clickedBody, clickedBody.position, force);

                if (debugCheckbox.checked) {
                    console.log('Body Repelled:', {
                        id: clickedBody.id,
                        type: clickedBody.circleRadius ? 'Circle' :
                            clickedBody.vertices ? 'Polygon' : 'Rectangle',
                        position: { x: clickedBody.position.x, y: clickedBody.position.y },
                        force: force,
                        distance: distance
                    });
                }
            }
        } else {
            var randomBody = createRandomBody(event.clientX, event.clientY);
            Composite.add(world, randomBody);
        }
    });

    return {
        engine: engine,
        runner: runner,
        render: render,
        canvas: render.canvas,
        stop: function () {
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
        }
    };
};

window.onload = function () {
    Example.ballPool();
};
