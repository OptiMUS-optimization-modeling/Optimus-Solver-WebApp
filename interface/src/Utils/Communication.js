const sendPollingRequest = (
    headers,
    body,
    endpoint,
    method,
    callback,
    errorCallback
) => {
    // generate a random request id
    const request_id = Math.random().toString(36).substring(7);
    body.request_id = request_id;

    let pollingInterval;

    // Function to poll the server at /pollrequest/<request_id>
    const pollServer = async () => {
        try {
            const pollResponse = await fetch(
                process.env.REACT_APP_BACKEND_URL + "/pollResult",
                {
                    method: "POST", // Usually, polling is done using GET requests
                    headers: headers,
                    body: JSON.stringify({
                        request_id: request_id,
                    }),
                    credentials: "include",
                }
            );

            if (pollResponse.ok) {
                // console.log("pollResponse", pollResponse);
                const response = await pollResponse.json();
                // console.log("pollResponse", result);
                if (response.data.status === "done") {
                    clearInterval(pollingInterval);
                    callback(response.data.result);
                } else if (response.data.status === "failed") {
                    clearInterval(pollingInterval);
                    errorCallback(response.data.error);
                }
            } else {
                throw new Error("Polling request failed");
            }
        } catch (error) {
            clearInterval(pollingInterval);
            errorCallback(error);
        }
    };

    // Send initial request
    fetch(process.env.REACT_APP_BACKEND_URL + endpoint, {
        method: method,
        headers: headers,
        body: JSON.stringify(body),
        credentials: "include", // Include this line to send cookies with the request
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.received) {
                // Start polling every 3 seconds, at most 20 times
                pollingInterval = setInterval(pollServer, 3000);

                // Stop polling after 20 times
                setTimeout(() => {
                    clearInterval(pollingInterval);
                    console.log("Polling stopped");
                }, 50 * 3000);
            } else {
                throw new Error(
                    "Initial request was not received by the server"
                );
            }
        })
        .catch((error) => {
            errorCallback(error);
        });
};

export default sendPollingRequest;
