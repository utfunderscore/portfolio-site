import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const hexToRgba = (hex: string, alpha: number) => {
	const normalized = hex.replace(/^#/, "");

	if (![3, 6].includes(normalized.length)) {
		return `rgba(15, 23, 42, ${alpha})`;
	}

	const fullHex =
		normalized.length === 3
			? normalized
					.split("")
					.map((char) => char + char)
					.join("")
			: normalized;

	const [r, g, b] = [
		parseInt(fullHex.slice(0, 2), 16),
		parseInt(fullHex.slice(2, 4), 16),
		parseInt(fullHex.slice(4, 6), 16),
	];

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
