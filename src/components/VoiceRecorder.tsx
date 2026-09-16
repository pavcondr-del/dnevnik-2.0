import { useState, useRef, useEffect } from "react";
import { Button } from "./ui";
import { MicIcon, StopIcon } from "./icons";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Таймер записи
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Не удалось получить доступ к микрофону. Проверьте разрешения.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
  };

  return (
    <div className="space-y-4">
      {/* Индикатор записи */}
      <div className="flex items-center justify-between rounded-lg bg-elev p-4">
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          )}
          <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
        </div>
        
        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} variant="primary">
              <MicIcon size={18} />
              Начать запись
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="danger">
              <StopIcon size={18} />
              Остановить
            </Button>
          )}
        </div>
      </div>

      {/* Аудиоплеер */}
      {audioUrl && (
        <div className="space-y-3">
          <audio controls src={audioUrl} className="w-full" />
          <Button onClick={resetRecording} variant="ghost" size="sm">
            Записать заново
          </Button>
        </div>
      )}
    </div>
  );
}
