import { useState, useRef, useEffect } from "react";
import { Button } from "./ui";
import { PlayIcon, PauseIcon, StopIcon, DownloadIcon } from "./icons";

interface AudioPlayerProps {
  audioSrc: string;
}

export function AudioPlayer({ audioSrc }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = `voice-note-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-elev p-3">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      {/* Кнопки управления */}
      <div className="flex gap-1">
        <Button
          variant="soft"
          size="sm"
          onClick={togglePlay}
          className="!px-3"
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={stop}
          className="!px-3"
        >
          <StopIcon size={16} />
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={download}
          className="!px-3"
          title="Скачать на компьютер"
        >
          <DownloadIcon size={16} />
        </Button>
      </div>

      {/* Прогресс-бар */}
      <div className="flex-1">
        <div className="relative h-2 rounded-full bg-line overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-mut">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
