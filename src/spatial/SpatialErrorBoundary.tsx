import { Component, type ReactNode } from "react";

export class SpatialErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[spatial] scene failed, using 2D fallback", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
