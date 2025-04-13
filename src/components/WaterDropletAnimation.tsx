import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface WaterDropletAnimationProps {
  className?: string;
}

const WaterDropletAnimation: React.FC<WaterDropletAnimationProps> = ({ className = '' }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize physics engine only once
    if (isInitializedRef.current || !sceneRef.current) return;
    isInitializedRef.current = true;

    // Setup Matter.js
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Body = Matter.Body;
    const Common = Matter.Common;

    // Create engine
    const engine = Engine.create({
      gravity: { x: 0, y: 0.2 },
      enableSleeping: true,
    });
    engineRef.current = engine;

    // Get container dimensions
    const containerWidth = sceneRef.current.clientWidth;
    const containerHeight = sceneRef.current.clientHeight;

    // Create renderer
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
      // Bottom wall (with slight angle for droplets to slide towards middle)
      Bodies.rectangle(
        containerWidth / 2, 
        containerHeight + wallThickness / 2 - 10, 
        containerWidth * 1.5, 
        wallThickness, 
        { 
          isStatic: true,
          angle: 0.05,
          render: { visible: false }
        }
      ),
      // Left wall
      Bodies.rectangle(
        -wallThickness / 2, 
        containerHeight / 2, 
        wallThickness, 
        containerHeight * 2, 
        { 
          isStatic: true,
          render: { visible: false }
        }
      ),
      // Right wall
      Bodies.rectangle(
        containerWidth + wallThickness / 2, 
        containerHeight / 2, 
        wallThickness, 
        containerHeight * 2, 
        { 
          isStatic: true,
          render: { visible: false }
        }
      ),
      // Top funnel left
      Bodies.rectangle(
        containerWidth / 4,
        -wallThickness / 2 + 10,
        containerWidth / 2,
        wallThickness,
        {
          isStatic: true,
          angle: -0.3,
          render: { visible: false }
        }
      ),
      // Top funnel right
      Bodies.rectangle(
        containerWidth / 4 * 3,
        -wallThickness / 2 + 10,
        containerWidth / 2,
        wallThickness,
        {
          isStatic: true,
          angle: 0.3,
          render: { visible: false }
        }
      )
    ];
    World.add(engine.world, walls);

    // Create water droplets
    let droplets: Matter.Body[] = [];
    
    // Function to create a water droplet
    const createDroplet = () => {
      // Random size between 5 and 15
      const size = 5 + Math.random() * 8;
      
      // Random blue color with transparency
      const blueShade = Math.floor(200 + Math.random() * 55);
      const alpha = 0.6 + Math.random() * 0.4;
      const color = `rgba(100, ${blueShade}, 255, ${alpha})`;
      
      // Create the droplet at random position at top
      const droplet = Bodies.circle(
        20 + Math.random() * (containerWidth - 40),
        -20,
        size,
        {
          restitution: 0.5,
          friction: 0.001,
          frictionAir: 0.002,
          render: {
            fillStyle: color,
            strokeStyle: `rgba(120, ${blueShade}, 255, ${alpha})`,
            lineWidth: 1
          }
        }
      );
      
      // Apply random horizontal force to make it move slightly
      Body.applyForce(
        droplet, 
        { x: droplet.position.x, y: droplet.position.y }, 
        { x: (Math.random() - 0.5) * 0.001, y: 0 }
      );
      
      // Add to world
      World.add(engine.world, droplet);
      droplets.push(droplet);
      
      // Remove droplet after 10-15 seconds to prevent memory issues
      setTimeout(() => {
        if (droplet && engine.world.bodies.includes(droplet)) {
          World.remove(engine.world, droplet);
          droplets = droplets.filter(d => d !== droplet);
        }
      }, 10000 + Math.random() * 5000);
    };
    
    // Add initial droplets
    for (let i = 0; i < 15; i++) {
      setTimeout(() => createDroplet(), i * 300);
    }
    
    // Add new droplets periodically
    const dropletInterval = setInterval(() => {
      // Only add new droplets if there are fewer than 30
      if (droplets.length < 30) {
        createDroplet();
      }
    }, 800);
    
    // Start the engine
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current || !renderRef.current) return;
      
      const newWidth = sceneRef.current.clientWidth;
      const newHeight = sceneRef.current.clientHeight;
      
      // Update render canvas size
      Render.setPixelRatio(render, window.devicePixelRatio);
      render.options.width = newWidth;
      render.options.height = newHeight;
      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      
      // Update walls to match new dimensions
      for (let wall of walls) {
        if (wall.position.y > newHeight - 20) {
          // This is the bottom wall
          Body.setPosition(wall, { x: newWidth / 2, y: newHeight + wallThickness / 2 - 10 });
          Body.setVertices(wall, Bodies.rectangle(
            newWidth / 2, 
            newHeight + wallThickness / 2 - 10, 
            newWidth * 1.5, 
            wallThickness
          ).vertices);
        } else if (wall.position.x > newWidth - 20) {
          // This is the right wall
          Body.setPosition(wall, { x: newWidth + wallThickness / 2, y: newHeight / 2 });
          Body.setVertices(wall, Bodies.rectangle(
            newWidth + wallThickness / 2, 
            newHeight / 2, 
            wallThickness, 
            newHeight * 2
          ).vertices);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      // Clear interval
      clearInterval(dropletInterval);
      
      // Remove event listener
      window.removeEventListener('resize', handleResize);
      
      // Destroy engine and renderer
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
      className={`water-droplet-animation ${className}`}
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

export default WaterDropletAnimation; 