import { useEffect, useRef } from "react";
import { getRespiroSound, type RespiroSoundId } from "@/data/respiro";

const DEFAULT_VOLUME = 0.42;

/**
 * Reproduz loop ambiente ao selecionar um som no Espaço do Respiro.
 * Requer gesto do usuário (toque no botão) para contornar políticas de autoplay.
 */
export function useRespiroAmbientSound(activeSoundId: RespiroSoundId | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const previous = audioRef.current;
    if (previous) {
      previous.pause();
      previous.src = "";
      audioRef.current = null;
    }

    if (!activeSoundId) return;

    const sound = getRespiroSound(activeSoundId);
    if (!sound) return;

    const audio = new Audio(sound.src);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;

    void audio.play().catch(() => {
      // Falha silenciosa se o browser bloquear — usuário pode tocar de novo
    });

    return () => {
      audio.pause();
      audio.src = "";
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [activeSoundId]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
        audioRef.current = null;
      }
    };
  }, []);
}
