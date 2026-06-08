import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export default function EvalBar({ whiteFraction, height = 200 }) {
    const clamped = Math.max(0, Math.min(1, whiteFraction));
    const blackPct = (1 - clamped) * 100;
    return (_jsxs("div", { className: "relative flex flex-col w-2 h-full rounded-sm overflow-hidden border border-mando-gold/20", style: { height }, children: [_jsx("span", { className: "absolute top-0 left-0 right-0 z-10 text-center text-[9px] text-imperial-red/70 font-mono leading-none pt-0.5", children: "B" }), _jsxs("div", { className: "flex flex-col flex-1 min-h-0 mt-3 mb-3", children: [_jsx(motion.div, { className: "w-full bg-imperial-gray shrink-0 transition-all duration-700", animate: { height: `${blackPct}%` }, transition: { duration: 0.7 } }), _jsx("div", { className: "w-full flex-1 min-h-[3px] bg-mando-silver transition-all duration-700" })] }), _jsx("span", { className: "absolute bottom-0 left-0 right-0 z-10 text-center text-[9px] text-mando-silver/70 font-mono leading-none pb-0.5", children: "W" })] }));
}
