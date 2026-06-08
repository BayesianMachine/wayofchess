import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import Button from '@/components/ui/Button';
export default class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8", children: [_jsx("h1", { className: "text-2xl text-mando-gold font-semibold", children: "Something went wrong" }), _jsx("p", { className: "text-mando-silver", children: "An unexpected error occurred. Please reload the page." }), _jsx(Button, { onClick: () => window.location.reload(), children: "Reload" })] }));
        }
        return this.props.children;
    }
}
