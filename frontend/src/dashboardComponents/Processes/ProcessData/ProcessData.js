import '../ProcessData/ProcessData.css'; 
import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../ContextProvider/ContextProvider';

function ProcessData() {
    const { context } = useContext(MyContext);
    let activeProcessLength = Object.keys(Object.fromEntries(Object.entries( context.processes).filter(([key, value]) => value.status === "ACTIVE"))).length;
    const [totalProcessCPU, setTotalProcessCPU] = useState(0)
    useEffect(() => {
        let cpuUsages = (Object.entries(context.processes).map(process => process[1].cpu))
        if (cpuUsages.length > 0) {
            const sum = cpuUsages.reduce((accumulator, currentValue) => accumulator + Math.max(currentValue, 0), 0);
        
            if (!isNaN(sum)) {
                setTotalProcessCPU(sum.toFixed(1));
            } else {
                console.error("Sum is NaN. Check your input data.");
            }
        }
        
    }, [context])
    return (
        <div className="processData">
            <div className="processesActive">
                <h3>Processes Active:</h3>
                <p>{activeProcessLength}/{Object.keys(context.processes).length}</p>
            </div>
            <div className="processSummary">
                <h3>Processes Total CPU:</h3>
                <p>{totalProcessCPU}%</p>
            </div>
        </div>
    );
}

export default ProcessData;
