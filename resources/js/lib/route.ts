import { route as ziggyRoute } from 'ziggy-js';
import type { Config } from 'ziggy-js';

declare global {
    interface Window {
        route?: typeof ziggyRoute;
    }
}

let ziggyConfig: Config | undefined;

export function setZiggyConfig(config: Config): void {
    ziggyConfig = config;
}

export function route(
    name?: string,
    params?: Record<string, unknown> | number | string,
    absolute?: boolean,
): string {
    if (ziggyConfig) {
        // @ts-expect-error ziggy overloads are broad
        return ziggyRoute(name, params, absolute, ziggyConfig);
    }

    if (typeof window !== 'undefined' && typeof window.route === 'function') {
        // @ts-expect-error ziggy overloads are broad
        return window.route(name, params, absolute);
    }

    // @ts-expect-error ziggy overloads are broad
    return ziggyRoute(name, params, absolute);
}
