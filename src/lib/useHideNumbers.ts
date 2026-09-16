import { useStore } from "./store";

export function useHideNumbers() {
  const { state } = useStore();
  return state.settings.hideNumbers;
}
