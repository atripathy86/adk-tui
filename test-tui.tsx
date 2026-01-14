import { render } from "@opentui/solid";

render(
  () => <text>Hello from OpenTUI!</text>,
  {
    targetFps: 10,
    exitOnCtrlC: true,
    useKittyKeyboard: null,
    useMouse: false,
    useAlternateScreen: false,
  }
);
