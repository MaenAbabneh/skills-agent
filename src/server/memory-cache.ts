type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const cache = new Map<string, CacheEntry<any>>();

const now = () => Date.now();

export function setCache<T>(key: string, value: T, ttlMs: number) {
	cache.set(key, { value, expiresAt: now() + ttlMs });
}

export function getCache<T>(key: string): T | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (entry.expiresAt <= now()) {
		cache.delete(key);
		return null;
	}

	return entry.value as T;
}

export function deleteCache(key: string) {
	cache.delete(key);
}

export function clearCache() {
	cache.clear();
}

export function peekCache(key: string) {
	return cache.get(key) ?? null;
}

export default { setCache, getCache, deleteCache, clearCache, peekCache };
