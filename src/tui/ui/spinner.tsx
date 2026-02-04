import { createSignal, onMount, onCleanup, Show, type JSX } from "solid-js";
import { useTheme } from "../context/theme";
import type { RGBA } from "@opentui/core";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const DOTS_FRAMES = ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"];
const BLOCKS_FRAMES = ["▖", "▘", "▝", "▗"];

export type SpinnerStyle = "braille" | "dots" | "blocks";

export interface SpinnerProps {
  style?: SpinnerStyle;
  color?: RGBA;
  interval?: number;
  children?: JSX.Element;
}

function getFrames(style: SpinnerStyle): string[] {
  switch (style) {
    case "braille":
      return SPINNER_FRAMES;
    case "dots":
      return DOTS_FRAMES;
    case "blocks":
      return BLOCKS_FRAMES;
    default:
      return SPINNER_FRAMES;
  }
}

export function Spinner(props: SpinnerProps) {
  const { theme } = useTheme();
  const [frameIndex, setFrameIndex] = createSignal(0);

  const frames = () => getFrames(props.style ?? "braille");
  const interval = () => props.interval ?? 80;
  const color = () => props.color ?? theme.primary;

  let intervalId: NodeJS.Timeout;

  onMount(() => {
    intervalId = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames().length);
    }, interval());
  });

  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return (
    <box flexDirection="row" gap={1}>
      <text fg={color()}>{frames()[frameIndex()]}</text>
      <Show when={props.children}>{props.children}</Show>
    </box>
  );
}

// Loading indicator with text
export interface LoadingProps {
  text?: string;
  style?: SpinnerStyle;
}

export function Loading(props: LoadingProps) {
  const { theme } = useTheme();

  return (
    <Spinner style={props.style}>
      <text fg={theme.textMuted}>{props.text ?? "Loading..."}</text>
    </Spinner>
  );
}
