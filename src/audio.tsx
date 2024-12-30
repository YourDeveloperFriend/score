import { createContext, ReactNode, useCallback, useContext, useRef } from "react";


export enum Audio {
  WOOHOO = 1,
  BOOHOO,
}

const AudioContext = createContext<((audio: Audio) => void) | undefined>(undefined);

function stop(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
}

export function AudioContextProvider({ children }: { children: ReactNode }) {
  const woohooRef = useRef<HTMLAudioElement>(null);
  const boohooRef = useRef<HTMLAudioElement>(null);
  const play = useCallback((audio: Audio) => {
    stop(boohooRef.current!);
    stop(woohooRef.current!);

    switch (audio) {
      case Audio.WOOHOO:
        woohooRef.current!.play();
        break;

      case Audio.BOOHOO:
        boohooRef.current!.play();
        break;
    }
  }, [woohooRef, boohooRef]);
  return <>
    <audio ref={woohooRef}>
      <source src="/woohoo.ogg" type="audio/ogg"></source>
      <source src="/woohoo.wav" type="audio/wav"></source>
    </audio>
    <audio ref={boohooRef}><source src="/boohoo.wav" type="audio/wav"></source></audio>
    <AudioContext.Provider value={play}>
      {children}
    </AudioContext.Provider>
  </>
}


export function usePlay(): (audio: Audio) => void {
  return useContext(AudioContext)!;
}