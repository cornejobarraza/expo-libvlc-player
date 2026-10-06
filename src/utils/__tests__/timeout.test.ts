import { renderHook } from "@testing-library/react-native";

import { useTimeoutRef } from "../timeout";

describe(useTimeoutRef, () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs the handler after the timeout", async () => {
    const { result } = await renderHook(() => useTimeoutRef());
    const handler = jest.fn();

    result.current(handler, 1000);

    jest.advanceTimersByTime(999);

    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("clears the pending timeout when a new one is set", async () => {
    const { result } = await renderHook(() => useTimeoutRef());
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    result.current(firstHandler, 1000);
    result.current(secondHandler, 1000);

    jest.runAllTimers();

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it("clears the pending timeout set after a rerender", async () => {
    const { result, rerender } = await renderHook(() => useTimeoutRef());
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    result.current(firstHandler, 1000);

    await rerender(undefined);

    result.current(secondHandler, 1000);

    jest.runAllTimers();

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it("clears the pending timeout on unmount", async () => {
    const { result, rerender, unmount } = await renderHook(() => useTimeoutRef());
    const handler = jest.fn();

    await rerender(undefined);

    result.current(handler, 1000);

    await unmount();
    jest.runAllTimers();

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not throw on unmount without a pending timeout", async () => {
    const { unmount } = await renderHook(() => useTimeoutRef());

    await expect(unmount()).resolves.not.toThrow();
  });
});
