import { jsx as _jsx } from "react/jsx-runtime";
export default function LoadingSpinner() {
    return (_jsx("div", { className: "flex items-center justify-center min-h-[50vh]", children: _jsx("div", { className: "w-12 h-12 border-2 border-mando-gold border-t-transparent rounded-full animate-spin" }) }));
}
