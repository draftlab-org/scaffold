import type { ReactNode } from 'react';

export interface TagProps {
	variant?: 'primary' | 'secondary' | 'highlight' | 'gray';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	children?: ReactNode;
}

const baseStyles = 'tag-base';

const variants = {
	primary: 'tag-primary',
	secondary: 'tag-secondary',
	highlight: 'tag-highlight',
	gray: 'tag-gray',
};

const sizes = {
	sm: 'tag-size-sm',
	md: 'tag-size-md',
	lg: 'tag-size-lg',
};

export default function Tag({
	variant = 'primary',
	size = 'sm',
	className = '',
	children,
}: TagProps) {
	const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

	return <span className={classes}>{children}</span>;
}
