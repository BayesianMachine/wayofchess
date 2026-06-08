import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const srOnlyStyle = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
};
export function BoardAccessibility({ lastMove, isCheck, isCheckmate }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { "aria-live": "polite", "aria-atomic": "true", style: srOnlyStyle, children: lastMove && `Move: ${lastMove.san}` }), _jsx("div", { "aria-live": "assertive", "aria-atomic": "true", style: srOnlyStyle, children: isCheckmate ? 'Checkmate' : isCheck ? 'Check!' : '' })] }));
}
