import type { ReactNode } from 'react';

export interface TagProps {
	variant?: 'primary' | 'secondary' | 'highlight' | 'gray';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	// Alias so Astro call sites can keep using `class`
	class?: string;
	children?: ReactNode;
	[key: string]: unknown;
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
	className,
	class: classAlias,
	children,
	...props
}: TagProps) {
	const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className ?? classAlias ?? ''}`.trim();

	return (
		<span className={classes} {...props}>
			{children}
		</span>
	);
}
