import React from 'react';

const NodeCanvasSettings = ({
  snapToGrid,
  setSnapToGrid,
  gridX,
  setGridX,
  gridY,
  setGridY,
  showKeyWindow,
  setShowKeyWindow,
}) => {
  
  const handleSnapToGridChange = (e) => {
    setSnapToGrid(e.target.checked);
  };

  const handleGridXChange = (e) => {
    setGridX(e.target.value);
  };

  const handleGridYChange = (e) => {
    setGridY(e.target.value);
  };

  const handleShowKeyWindowChange = (e) => {
    setShowKeyWindow(e.target.checked);
  };

  return (
    <div className='nodeCanvasSettings'>
      <h3>Node Canvas Settings</h3>

      <label>
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={handleSnapToGridChange}
        />
        Snap Nodes to Grid
      </label>

      {snapToGrid && (
        <div style={{ marginTop: '10px' }}>
          <label>
            Grid X:
            <input
              type="number"
              value={gridX}
              onChange={handleGridXChange}
              min={1}
              style={{ marginLeft: '5px'}}
            />
          </label>
        </div>
      )}

        {snapToGrid && (
        <div style={{ marginTop: '10px' }}>
          <label>
            Grid Y:
            <input
              type="number"
              value={gridY}
              onChange={handleGridYChange}
              min={1}
              style={{ marginLeft: '5px' }}
            />
          </label>
        </div>
      )}

      <div style={{ marginTop: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={showKeyWindow}
            onChange={handleShowKeyWindowChange}
          />
          Show Key Window
        </label>
      </div>
    </div>
  );
};

export default NodeCanvasSettings;
