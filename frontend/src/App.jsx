import LetterGlitch from "./components/LetterGlitch";
import { TextareaButton } from "@/components/TextareaButton";
import "./App.css";
import { useState } from "react";

function App() {

  return (
    <div className="dark relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchColors={["#ffffff", "#61dca3"]}
          baseColor="#ffffff"
          glitchAmount={0.5}
          speed={1}
          flow={0.5}
          clickEffect="tear"
          fontSize={14}
          spacing={0.6}
          density={0.9}
          baseOpacity={0.16}
          smooth
          edgeFade={0}
          centerFade={0}
          interactive
          cursorRadius={140}
          intro
          lightMode={false}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-5">
        <h1 className="mb-8 text-3xl font-bold text-white">Bulk Mail App</h1>

        <div className="w-full max-w-xl rounded-xl bg-black/60 p-6 backdrop-blur-sm">
          <TextareaButton />
        </div>
      </div>
    </div>
  );
}

export default App;