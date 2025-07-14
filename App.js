import React from "react";

// AWS Amplify configuration will be restored after amplify pull
// import Amplify from "aws-amplify";
// import { DataStore } from "@aws-amplify/datastore";
// import awsconfig from "./src/aws-exports";
// Amplify.configure(awsconfig);
// DataStore.configure(awsconfig);

import Navigator from "./src/navigation/Navigator";

export default function App() {

  return (
    <>
      <Navigator />
    </>
  );
}

