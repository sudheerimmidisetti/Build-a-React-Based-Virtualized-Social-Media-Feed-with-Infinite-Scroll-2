import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Post render failed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-200">
                    This post could not be rendered.
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;