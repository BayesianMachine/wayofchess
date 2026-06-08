import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export default function CheckRing({ squareSize: _squareSize }) {
    return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: [0, 0.85, 0.6], scale: [0.85, 1, 1] }, transition: { duration: 0.35, times: [0, 0.4, 1] }, style: {
            position: 'absolute',
            inset: 0,
            border: '3px solid #C0392B',
            borderRadius: 2,
            pointerEvents: 'none',
            boxSizing: 'border-box',
        } }));
}
