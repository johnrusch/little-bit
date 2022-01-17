/* Amplify Params - DO NOT EDIT
	API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIENDPOINTOUTPUT
	API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

exports.handler = async (event) => {
    // TODO implement

    console.log("BIG EVENT", event)
    const response = {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }, 
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
