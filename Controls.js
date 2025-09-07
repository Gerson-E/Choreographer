import React from 'react';

const Controls = ({ startSimulation, stopSimulation, resetSimulation, simulationState, metrics }) => {
  return (
    <div className="controls">
      <div className="control-buttons">
        <button 
          onClick={startSimulation}
          disabled={simulationState === 'running'}
          className="start-button"
        >
          {simulationState === 'running' ? 'Simulation Running...' : 'Start Simulation'}
        </button>
        
        <button 
          onClick={stopSimulation}
          disabled={simulationState !== 'running'}
          className="stop-button"
        >
          Stop Simulation
        </button>
        
        <button 
          onClick={resetSimulation}
          className="reset-button"
        >
          Reset
        </button>
      </div>
      
      <div className="metrics">
        <h3>Mission Metrics</h3>
        <div className="metric-item">
          <span className="metric-label">Mission Time:</span>
          <span className="metric-value">{metrics.time}s</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Distance Traveled:</span>
          <span className="metric-value">{metrics.distance}px</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Collisions Avoided:</span>
          <span className="metric-value">{metrics.collisionsAvoided}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Status:</span>
          <span className={`metric-value status-${simulationState}`}>
            {simulationState.charAt(0).toUpperCase() + simulationState.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="simulation-info">
        <h4>Interactive Multi-Robot Simulation</h4>
        <p>This simulation demonstrates advanced AMR coordination with collision avoidance and dynamic pathfinding.</p>
        <ul>
          <li><strong>Blue circles:</strong> Moving robots (numbered)</li>
          <li><strong>Red circles:</strong> Paused robots (collision avoidance)</li>
          <li><strong>Green circles:</strong> Finished robots</li>
          <li><strong>Gray rectangles:</strong> Static obstacles</li>
          <li><strong>Yellow arrows:</strong> Robot direction</li>
          <li><strong>Light blue lines:</strong> Planned paths</li>
          <li><strong>Red circles:</strong> Collision detection zones</li>
        </ul>
        <div className="interaction-info">
          <h5>Interactive Features:</h5>
          <ul>
            <li>Click anywhere during simulation to add obstacles</li>
            <li>Robots automatically recalculate paths when obstacles are added</li>
            <li>Robots pause to avoid collisions with each other</li>
            <li>Higher ID robots yield to lower ID robots</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Controls;
