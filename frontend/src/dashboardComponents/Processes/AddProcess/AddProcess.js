import React, { useState, useContext } from 'react';
import './AddProcess.css'; 
import { MyContext } from '../../../ContextProvider/ContextProvider';

function AddProcess() {
    const [runTime, setRunTime] = useState('');
    const [path, setPath] = useState('');
    const [restartOnError, setRestartOnError] = useState(false);
    const [maxRestartCounter, setMaxRestartCounter] = useState(-1);
    const [processName, setProcessName] = useState('');
    const [bootOnServerStartup, setBootOnServerStartup] = useState(false);

    const { context } = useContext(MyContext);

    const handleSubmit = (e) => {
        e.preventDefault();

        context.processFunctions.addProcess(
            processName,
            runTime,
            path,
            restartOnError,
            maxRestartCounter,
            bootOnServerStartup,
        );


        setProcessName('');
        setRunTime('');
        setPath('');
        setRestartOnError(false);
        setMaxRestartCounter(-1);
        setBootOnServerStartup(false);
    };

    return (
        <div className="addProcess">
            <h2>Add Process</h2>
            <form onSubmit={handleSubmit}>
                <div className="formGroup">
                    <label htmlFor="processName">Process Name:</label>
                    <input
                        type="text"
                        id="processName"
                        value={processName}
                        onChange={(e) => setProcessName(e.target.value)}
                    />
                </div>
                <div className="formGroup">
                    <label htmlFor="runTime">Run Time:   (python, node, etc.)</label>
                    <input
                        type="text"
                        id="runTime"
                        value={runTime}
                        onChange={(e) => setRunTime(e.target.value)}
                    />
                </div>
                <div className="formGroup">
                    <label htmlFor="path">Path to File:</label>
                    <input
                        type="text"
                        id="path"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                    />
                </div>
                <div className="formGroup">
                    <label htmlFor="restartOnError">
                        <input
                            type="checkbox"
                            id="restartOnError"
                            checked={restartOnError}
                            onChange={(e) => setRestartOnError(e.target.checked)}
                        />
                        Restart on Error
                    </label>
                </div>
                {restartOnError
                
                ?
                <div className="formGroup">
                    <label htmlFor="maxRestartCounter">Max Restart Counter: (-1 is infinite)</label>
                    <input
                        type="number"
                        id="maxRestartCounter"
                        value={maxRestartCounter}
                        onChange={(e) => setMaxRestartCounter(e.target.value)}
                    />
                </div>
                :
                null
                
                }
                <div className="formGroup">
                    <label htmlFor="bootOnServerStartup">
                        <input
                            type="checkbox"
                            id="bootOnServerStartup"
                            checked={bootOnServerStartup}
                            onChange={(e) => setBootOnServerStartup(e.target.checked)}
                        />
                        Boot on Server Startup
                    </label>
                </div>
                <button type="submit">Add Process</button>
            </form>
        </div>
    );
}

export default AddProcess;
