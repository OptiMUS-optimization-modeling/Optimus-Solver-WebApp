import React, { useEffect, useState } from 'react';

function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('/extract_params', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ problem_description: "dummy_problem" })
        })
        .then(response => response.json())
        .then(data => setData(data));
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <h1>API Data</h1>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </header>
        </div>
    );
}

export default App;