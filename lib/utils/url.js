/**
 * Takes a pathname that may have win32 separators and ensures it's ready to be used as a URI
 * @param {string} pathname
 * @returns {string}
 */
export function toUrlPathname(pathname) {
	return pathname.replace(/\\/g, "/");
}
