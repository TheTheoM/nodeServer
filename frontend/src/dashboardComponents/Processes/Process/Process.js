import React, { useState, useContext} from 'react';
import Down from '../../../IconComponents/Down';
import './Process.css'
import { MyContext } from '../../../ContextProvider/ContextProvider';

function Process({name, id, status, initialRuntime, initialRestartOnError, initialRestartDelay, initialPath, onExpanded, cpu, ram, startup}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [runtime, setRuntime] = useState(initialRuntime);
    const [restartOnError, setRestartOnError] = useState(initialRestartOnError);
    const [restartDelay, setRestartDelay] = useState(initialRestartDelay);
    const [path, setPath] = useState(initialPath);

    const handleEdit = () => setIsEditing(true);
    const handleSubmit = () => setIsEditing(false);
    const handleCancel = () => setIsEditing(false)

    const { context } = useContext(MyContext);


    function toggleExpand() {
        setIsExpanded(!isExpanded)
        onExpanded(!isExpanded, id)
    }

    return (
        <div className={"process " + (isExpanded ? "expanded" : "")} id = {id}>
            <div className={'process-top-bar ' + (isExpanded ? "expanded-top-bar" : "")}>
                <p className='process-name'>{name}</p>
                <div className='textArrowContainer'>
                    <p className='resourceData'> {cpu?.toFixed(0)}%</p>
                    <p className='resourceData'> {parseFloat(ram)?.toFixed(0)}MB</p>
                    <p className={status === 'ACTIVE' ? 'process-status-text process-text-active' : 'process-status-text process-text-inactive'}>
                        {status}
                    </p>
                    <p className={startup ? 'process-status-text process-text-active' : 'process-status-text process-text-inactive'}>
                        {startup ? "ENABLED": "DISABLED"}
                    </p>
                    <Down 
                        style={{cursor: "pointer", transform: (isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'), marginTop: (isExpanded ? '-3px' : '8px')}} 
                        onClick={toggleExpand} 
                    />
                </div>
            </div>

            <div style={{ display: isExpanded ? "flex" : "none" }} className='process-content'>
                <div className="left-box">
                    <div className="field">
                        <label htmlFor="runtime">Runtime:</label>
                        {isEditing ? (
                            <input type="text" id="runtime" name="runtime" value={runtime} onChange={(e) => setRuntime(e.target.value)} />
                        ) : (
                            <span>{runtime}</span>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="path" style={{'marginRight': '10px'}}>Path: </label>
                        {isEditing ? (
                            <input type="text" id="path" name="path" value={path} onChange={(e) => setPath(e.target.value)} />
                        ) : (
                            <span>{path}</span>
                        )}
                    </div>
                    <div className="field">
                        <>Restart on error</>
                        <label>
                            <input 
                                type="checkbox" 
                                id="restartOnError" 
                                name="restartOnError" 
                                checked={restartOnError} 
                                onChange={(e) => setRestartOnError(e.target.checked)} 
                                disabled={!isEditing}
                            />
                        </label>
                    </div>
                    <div className="field">
                        <label htmlFor="restartDelay">Restart Delay:</label>
                        {isEditing ? (
                            <input type="text" id="restartDelay" name="restartDelay" value={restartDelay} onChange={(e) => setRestartDelay(e.target.value)} />
                        ) : (
                            <span>{restartDelay}</span>
                        )}
                    </div>
                    <div className="edit-buttons">
                        <button onClick={handleCancel}>Cancel</button>
                        {isEditing ? (
                            <button onClick={handleSubmit}>Submit</button>
                        ) : (
                            <button onClick={handleEdit}>Edit</button>
                        )}
                    </div>
                </div>
                <div className="right-box">
                    <h3>Controls:</h3>
                    <div className="buttons">
                        <div><button onClick={() => {context.processFunctions.startProcess(name)}}>Start</button></div>
                        <div><button onClick={() => {context.processFunctions.restartProcess(name)}}>Restart</button></div>
                        <div>
                            <button onClick={() => { context.processFunctions.editProcess(name, undefined, undefined, undefined, undefined, true) }}>Enable</button>
                        </div>
                        <div><button onClick={() => {context.processFunctions.killProcess(name)}}>Kill</button></div>
                        <div><button onClick={() => {context.processFunctions.removeProcess(name)}}>Erase</button></div>
                        <div>
                            <button onClick={() => { context.processFunctions.editProcess(name, undefined, undefined, undefined, undefined, false) }}>Disable</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Process;
