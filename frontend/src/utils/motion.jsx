import React from 'react';

// Minimal motion stub used when framer-motion is not installed.
// Exposes `div` and `span` that forward props. This preserves layout
// and avoids build errors in environments without framer-motion.
const make = (Tag) => React.forwardRef(({ children, ...props }, ref) => (
  <Tag ref={ref} {...props}>{children}</Tag>
));

const motion = {
  div: make('div'),
  span: make('span'),
  p: make('p'),
};

export { motion };
export default motion;
