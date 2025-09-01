import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useEffect } from 'react';
export default function Page({ children, title }) {
    useEffect(() => {
        if (title) {
            document.title = `${title} - Dating or Not`;
        }
    }, [title]);
    return (_jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { type: 'spring', stiffness: 220, damping: 25 }, children: children }));
}
