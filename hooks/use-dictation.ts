"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DictationState = "idle" | "requesting" | "recording" | "transcribing" | "error";

type TranscriptionResponse = {
  text?: string;
  error?: string;
};

const MAX_RECORDING_MS = 60_000;

function preferredMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function extensionFor(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export function useDictation(onTranscript: (text: string) => void) {
  const [state, setState] = useState<DictationState>("idle");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const captureIdRef = useRef(0);
  const mountedRef = useRef(true);
  const transcriptRef = useRef(onTranscript);

  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  const supported = typeof window === "undefined" || (
    "MediaRecorder" in window && "mediaDevices" in navigator
  );

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, [clearTimer]);

  const cancel = useCallback(() => {
    captureIdRef.current += 1;
    clearTimer();
    requestRef.current?.abort();
    requestRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    releaseStream();
    if (mountedRef.current) {
      setState("idle");
      setError("");
    }
  }, [clearTimer, releaseStream]);

  const start = useCallback(async () => {
    if (!("mediaDevices" in navigator) || !("MediaRecorder" in window)) {
      setState("error");
      setError("Dictation is not available in this browser. You can still type your answer.");
      return;
    }

    const captureId = captureIdRef.current + 1;
    captureIdRef.current = captureId;
    setError("");
    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mountedRef.current || captureIdRef.current !== captureId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const mimeType = preferredMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (captureIdRef.current !== captureId || !mountedRef.current) return;
        clearTimer();
        releaseStream();
        setState("error");
        setError("The recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = async () => {
        clearTimer();
        releaseStream();
        recorderRef.current = null;
        if (captureIdRef.current !== captureId || !mountedRef.current) return;
        if (!chunks.length) {
          setState("error");
          setError("No speech was recorded. Please try again.");
          return;
        }

        setState("transcribing");
        const type = recorder.mimeType || mimeType || "audio/webm";
        const audio = new Blob(chunks, { type });
        const formData = new FormData();
        formData.append("audio", audio, `answer.${extensionFor(type)}`);
        const controller = new AbortController();
        requestRef.current = controller;

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          const result = (await response.json()) as TranscriptionResponse;
          if (!response.ok || !result.text) throw new Error(result.error || "That recording could not be transcribed.");
          if (captureIdRef.current !== captureId || !mountedRef.current) return;
          transcriptRef.current(result.text);
          setState("idle");
          setError("");
        } catch (transcriptionError) {
          if (controller.signal.aborted || captureIdRef.current !== captureId || !mountedRef.current) return;
          setState("error");
          setError(transcriptionError instanceof Error ? transcriptionError.message : "That recording could not be transcribed.");
        } finally {
          if (requestRef.current === controller) requestRef.current = null;
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
      timeoutRef.current = window.setTimeout(stop, MAX_RECORDING_MS);
    } catch (microphoneError) {
      if (captureIdRef.current !== captureId || !mountedRef.current) return;
      const name = microphoneError instanceof DOMException ? microphoneError.name : "";
      setState("error");
      setError(
        name === "NotAllowedError"
          ? "Microphone access was blocked. You can still type your answer."
          : name === "NotFoundError"
            ? "No microphone was found. You can still type your answer."
            : "The microphone could not be opened. Please try again.",
      );
    }
  }, [clearTimer, releaseStream, stop]);

  const toggle = useCallback(() => {
    if (state === "recording") stop();
    else if (state === "idle" || state === "error") void start();
  }, [start, state, stop]);

  useEffect(() => () => {
    mountedRef.current = false;
    captureIdRef.current += 1;
    clearTimer();
    requestRef.current?.abort();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [clearTimer]);

  return { state, error, supported, toggle, stop, cancel };
}
