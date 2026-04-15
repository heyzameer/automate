import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, variant = 'rect' }) => {
  const baseStyles = 'skeleton-shimmer';
  const variantStyles = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full mb-2',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export default Skeleton;
