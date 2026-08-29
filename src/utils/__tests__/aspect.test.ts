import { convertAspectRatio } from "../aspect";

describe(convertAspectRatio, () => {
  it("converts a ratio string to a number", () => {
    expect(convertAspectRatio("16:9")).toBeCloseTo(16 / 9);
    expect(convertAspectRatio("4:3")).toBeCloseTo(4 / 3);
    expect(convertAspectRatio("1:1")).toBe(1);
  });

  it("converts a decimal ratio string to a number", () => {
    expect(convertAspectRatio("1.85:1")).toBeCloseTo(1.85);
    expect(convertAspectRatio("2.39:1")).toBeCloseTo(2.39);
  });

  it("returns numbers unchanged", () => {
    expect(convertAspectRatio(1.5)).toBe(1.5);
    expect(convertAspectRatio(0)).toBe(0);
  });

  it("returns undefined unchanged", () => {
    expect(convertAspectRatio(undefined)).toBeUndefined();
  });

  it("returns ratio strings with a zero dimension unchanged", () => {
    expect(convertAspectRatio("0:9")).toBe("0:9");
    expect(convertAspectRatio("16:0")).toBe("16:0");
    expect(convertAspectRatio("0:0")).toBe("0:0");
  });

  it("returns ratio strings with a negative dimension unchanged", () => {
    expect(convertAspectRatio("-16:9")).toBe("-16:9");
    expect(convertAspectRatio("16:-9")).toBe("16:-9");
  });

  it("returns malformed ratio strings unchanged", () => {
    expect(convertAspectRatio("16" as never)).toBe("16");
    expect(convertAspectRatio("16:" as never)).toBe("16:");
    expect(convertAspectRatio(":9" as never)).toBe(":9");
    expect(convertAspectRatio("abc:def" as never)).toBe("abc:def");
  });
});
