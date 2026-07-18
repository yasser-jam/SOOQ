import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { BlockErrorBoundary, BlockErrorCard } from "../index";

const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("boom");
  }

  return <div>content rendered</div>;
};

describe("BlockErrorBoundary", () => {
  // React logs caught render errors loudly; keep test output clean.
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders children when nothing throws", () => {
    render(
      <BlockErrorBoundary fallback={() => <div>fallback</div>}>
        <Bomb shouldThrow={false} />
      </BlockErrorBoundary>
    );

    expect(screen.getByText("content rendered")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("renders the fallback with the thrown error and reports via onError", () => {
    const onError = jest.fn();

    render(
      <BlockErrorBoundary
        onError={onError}
        fallback={(error) => <div>failed: {error.message}</div>}
      >
        <Bomb shouldThrow />
      </BlockErrorBoundary>
    );

    expect(screen.getByText("failed: boom")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe("boom");
  });

  it("reset() re-renders the children (recovery path)", () => {
    const Host = () => {
      const [shouldThrow, setShouldThrow] = useState(true);

      return (
        <BlockErrorBoundary
          fallback={(error, reset) => (
            <button
              onClick={() => {
                setShouldThrow(false);
                reset();
              }}
            >
              retry
            </button>
          )}
        >
          <Bomb shouldThrow={shouldThrow} />
        </BlockErrorBoundary>
      );
    };

    render(<Host />);

    expect(screen.getByText("retry")).toBeInTheDocument();

    fireEvent.click(screen.getByText("retry"));

    expect(screen.getByText("content rendered")).toBeInTheDocument();
  });

  it("BlockErrorCard shows the block type, message and retry action", () => {
    const onRetry = jest.fn();

    render(
      <BlockErrorCard
        componentType="ProductCard"
        error={new Error("fetch failed")}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText(/ProductCard/)).toBeInTheDocument();
    expect(screen.getByText("fetch failed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
