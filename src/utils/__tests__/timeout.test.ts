import { renderHook } from "@testing-library/react-native";

import { useTimeoutRef } from "../timeout";

describe(useTimeoutRef, () => {
  it("returns a ref that can hold a timeout id", async () => {
    const { result } = await renderHook(() => useTimeoutRef());

    expect(result.current.current).toBeNull();

    result.current.current = setTimeout(() => {}, 1000);

    expect(result.current.current).not.toBeNull();
  });

  it("clears the pending timeout on unmount", async () => {
    jest.useFakeTimers();

    const { result, unmount } = await renderHook(() => useTimeoutRef());
    const callback = jest.fn();

    result.current.current = setTimeout(callback, 1000);

    await unmount();
    jest.runAllTimers();

    expect(callback).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
