// Physics Engine Setup
// Handles Matter.js engine, world, renderer, walls, and dividers

const PhysicsEngine = (function() {
    // Check if Matter.js is loaded
    if (typeof Matter === 'undefined') {
        console.error('Matter.js is not loaded. Please include Matter.js before this script.');
        return null;
    }

    // Initialize Matter.js modules
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Query = Matter.Query;

    let engine, world, render, runner, mouseConstraint;
    let width, height;
    let dividerWidth;

    // Create engine and world
    function initialize() {
        engine = Engine.create({
            positionIterations: 6,
            velocityIterations: 4
        });
        world = engine.world;

        // Adjust gravity
        engine.gravity.y = 0.5;

        // Get container dimensions
        const container = document.getElementById('canvas-container');
        width = container.clientWidth;
        height = container.clientHeight;

        // Create renderer
        render = Render.create({
            element: container,
            engine: engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: null
            }
        });

        // Create walls
        createWalls();

        // Setup mouse constraint
        setupMouseConstraint();

        // Create generation dividers
        createDividers();

        // Create a runner
        runner = Runner.create();
        Runner.run(runner, engine);

        // Start the renderer
        Render.run(render);

        // Return physics objects and Matter.js modules
        return {
            engine,
            world,
            render,
            runner,
            width,
            height,
            dividerWidth,
            Engine,
            Render,
            Runner,
            World,
            Bodies,
            Body,
            Composite,
            Query
        };
    }

    function createWalls() {
        const wallThickness = 100;
        const walls = [
            Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
                isStatic: true,
                render: {
                    fillStyle: '#666666'
                }
            }), // bottom
            Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 200, {
                isStatic: true,
                render: {
                    fillStyle: '#666666'
                }
            }), // left
            Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 200, {
                isStatic: true,
                render: {
                    fillStyle: '#666666'
                }
            }), // right
        ];

        World.add(world, walls);
    }

    function setupMouseConstraint() {
        const mouse = Matter.Mouse.create(render.canvas);
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });

        // Prevent Pokemon balls from being dragged
        Matter.Events.on(engine, 'beforeUpdate', function() {
            if (mouseConstraint.body && mouseConstraint.body.pokemon) {
                mouseConstraint.body = null;
                mouseConstraint.constraint.bodyB = null;
            }
        });

        World.add(world, mouseConstraint);
    }

    function createDividers() {
        const numGenerations = 8; // Pokemon has generations 1-8
        dividerWidth = width / numGenerations;
        const dividers = [];
        const dividerHeight = height + 200;

        for (let i = 1; i < numGenerations; i++) {
            const divider = Bodies.rectangle(
                i * dividerWidth,
                height / 2,
                4,
                dividerHeight,
                {
                    isStatic: true,
                    render: {
                        fillStyle: '#cccccc'
                    }
                }
            );
            dividers.push(divider);
        }

        // Add generation labels at the top of the chart area
        const chartArea = document.getElementById('chart-area');
        const labelsContainer = document.createElement('div');
        labelsContainer.id = 'generation-labels';
        labelsContainer.style.position = 'relative';
        labelsContainer.style.width = '100%';
        labelsContainer.style.height = '30px';
        labelsContainer.style.marginBottom = '10px';
        labelsContainer.style.display = 'flex';
        labelsContainer.style.justifyContent = 'space-around';
        labelsContainer.style.alignItems = 'center';
        
        for (let i = 0; i < numGenerations; i++) {
            const label = document.createElement('div');
            label.style.textAlign = 'center';
            label.style.fontWeight = 'bold';
            label.style.color = '#333';
            label.style.fontSize = '14px';
            label.innerHTML = `Gen ${i + 1}`;
            labelsContainer.appendChild(label);
        }
        
        // Insert labels container at the top of chart area (before legend)
        const legend = document.getElementById('legend');
        if (legend && legend.parentNode) {
            chartArea.insertBefore(labelsContainer, legend);
        } else {
            chartArea.insertBefore(labelsContainer, chartArea.firstChild);
        }

        World.add(world, dividers);
    }

    return {
        initialize
    };
})();

