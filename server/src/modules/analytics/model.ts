
import { t } from 'elysia';

export const AnalyticsModel = {
    statsQuery: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        groupBy: t.Optional(t.String()), // 'day', 'hour'
        since: t.Optional(t.String()),
        timeZone: t.Optional(t.String())
    })
};
