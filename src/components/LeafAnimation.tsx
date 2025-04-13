import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface LeafAnimationProps {
  className?: string;
}

const LeafAnimation: React.FC<LeafAnimationProps> = ({ className = '' }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize physics engine only once
    if (isInitializedRef.current || !sceneRef.current) return;
    isInitializedRef.current = true;

    // Setup Matter.js with optimized imports
    const { Engine, Render, World, Bodies, Runner, Body } = Matter;

    // Create engine with optimized settings
    const engine = Engine.create({
      gravity: { x: 0, y: 0.05 },
      enableSleeping: true,
    });
    engineRef.current = engine;

    // Get container dimensions
    const containerWidth = sceneRef.current.clientWidth;
    const containerHeight = sceneRef.current.clientHeight;

    // Create renderer with optimized settings
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: containerWidth,
        height: containerHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    // Create boundaries
    const wallThickness = 50;
    const walls = [
      // Bottom wall
      Bodies.rectangle(
        containerWidth / 2, 
        containerHeight + wallThickness / 2, 
        containerWidth * 1.5, 
        wallThickness, 
        { isStatic: true, render: { visible: false } }
      ),
      // Left wall
      Bodies.rectangle(
        -wallThickness / 2, 
        containerHeight / 2, 
        wallThickness, 
        containerHeight * 2, 
        { isStatic: true, render: { visible: false } }
      ),
      // Right wall
      Bodies.rectangle(
        containerWidth + wallThickness / 2, 
        containerHeight / 2, 
        wallThickness, 
        containerHeight * 2, 
        { isStatic: true, render: { visible: false } }
      )
    ];
    World.add(engine.world, walls);

    // Create leaves array
    let leaves: Matter.Body[] = [];

    // Simplified function to create a leaf
    const createLeaf = () => {
      const leafScale = 0.4 + Math.random() * 0.6;
      const isGreen = Math.random() > 0.3;
      const greenValue = 150 + Math.floor(Math.random() * 80);
      const redValue = 50 + Math.floor(Math.random() * 100);
      const color = isGreen 
        ? `rgba(${redValue}, ${greenValue}, 50, 0.8)` 
        : `rgba(${150 + Math.floor(Math.random() * 105)}, ${70 + Math.floor(Math.random() * 30)}, 30, 0.8)`;
      
      // Create leaf with simpler shape
      const leaf = Bodies.circle(
        Math.random() * containerWidth,
        -50,
        15 * leafScale,
        {
          render: {
            fillStyle: color,
            strokeStyle: isGreen ? 'rgba(0, 100, 0, 0.3)' : 'rgba(100, 50, 0, 0.3)',
            lineWidth: 1
          },
          frictionAir: 0.03 + Math.random() * 0.05,
          restitution: 0.2
        }
      );
      
      // Make it more leaf-like by stretching
      Body.scale(leaf, 1.5, 1);
      Body.rotate(leaf, Math.random() * Math.PI * 2);
      
      // Apply slight random force
      Body.applyForce(
        leaf, 
        { x: leaf.position.x, y: leaf.position.y }, 
        { x: (Math.random() - 0.5) * 0.0005, y: 0 }
      );
      
      // Add leaf to world
      World.add(engine.world, leaf);
      leaves.push(leaf);
      
      // Simplified flutter effect
      const flutterInterval = setInterval(() => {
        if (!leaf || !engine.world.bodies.includes(leaf)) {
          clearInterval(flutterInterval);
          return;
        }
        
        // Occasional small rotation and movement
        if (Math.random() > 0.7) {
          Body.setAngularVelocity(leaf, (Math.random() - 0.5) * 0.01);
          Body.applyForce(
            leaf, 
            { x: leaf.position.x, y: leaf.position.y }, 
            { x: (Math.random() - 0.5) * 0.00002, y: 0 }
          );
        }
      }, 200); // Reduced interval for better performance
      
      // Remove leaf after it falls out of view
      setTimeout(() => {
        if (leaf && engine.world.bodies.includes(leaf)) {
          clearInterval(flutterInterval);
          World.remove(engine.world, leaf);
          leaves = leaves.filter(l => l !== leaf);
        }
      }, 15000);
    };
    
    // Add initial leaves (fewer for better performance)
    for (let i = 0; i < 3; i++) {
      setTimeout(() => createLeaf(), i * 1000);
    }
    
    // Add new leaves periodically (less frequently)
    const leafInterval = setInterval(() => {
      if (leaves.length < 10) { // Reduced max leaves
        createLeaf();
      }
    }, 3000); // Less frequent leaf creation
    
    // Start the engine
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Optimized resize handler
    const handleResize = () => {
      if (!sceneRef.current || !renderRef.current) return;
      
      const newWidth = sceneRef.current.clientWidth;
      const newHeight = sceneRef.current.clientHeight;
      
      // Update render canvas size
      render.options.width = newWidth;
      render.options.height = newHeight;
      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      
      // Update bottom wall
      const bottomWall = walls[0];
      Body.setPosition(bottomWall, { x: newWidth / 2, y: newHeight + wallThickness / 2 });
      Body.setVertices(bottomWall, Bodies.rectangle(
        newWidth / 2, 
        newHeight + wallThickness / 2, 
        newWidth * 1.5, 
        wallThickness
      ).vertices);
      
      // Update right wall
      const rightWall = walls[2];
      Body.setPosition(rightWall, { x: newWidth + wallThickness / 2, y: newHeight / 2 });
      Body.setVertices(rightWall, Bodies.rectangle(
        newWidth + wallThickness / 2, 
        newHeight / 2, 
        wallThickness, 
        newHeight * 2
      ).vertices);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      clearInterval(leafInterval);
      window.removeEventListener('resize', handleResize);
      
      if (renderRef.current) {
        Render.stop(renderRef.current);
        renderRef.current.canvas.remove();
        renderRef.current = null;
      }
      
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
        engineRef.current = null;
      }
      
      if (runner) {
        Runner.stop(runner);
      }
      
      isInitializedRef.current = false;
    };
  }, []);

  return (
    <div 
      ref={sceneRef} 
      className={`leaf-animation ${className}`}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 45
      }}
    />
  );
};

export default LeafAnimation; 