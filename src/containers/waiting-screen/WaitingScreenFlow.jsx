import React from "react";

import { WaitingScreenProvider, useWaitingScreen } from "./WaitingScreenContext";
import WaitingScreenInput from "./waiting-screen-input/WaitingScreenInput";
import WaitingScreenPreview from "./waiting-screen-preview/WaitingScreenPreview";
import WaitingScreen from "./waiting-screen/WaitingScreen";

function FlowController() {
  // contextで現在stepだけ呼出
  const { step } = useWaitingScreen();

  if (step === 1) {
    return <WaitingScreenInput />;
  }
  if (step === 2) {
    return <WaitingScreenPreview />;
  }
  if (step === 3) {
    return <WaitingScreen />;
  }
  return <div>Loading...</div>;
}


function WaitingScreenFlow() {
  return (
    <WaitingScreenProvider>
      <FlowController />
    </WaitingScreenProvider>
  );
}

export default WaitingScreenFlow;