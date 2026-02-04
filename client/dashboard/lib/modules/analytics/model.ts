
import { t } from 'elysia';

export const AnalyticsModel = {
    statsQuery: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        groupBy: t.Optional(t.String()), // 'day', 'hour'
        since: t.Optional(t.String()),
        timeZone: t.Optional(t.String())
    }),
    statsBody: t.Object({
        knownAppIds: t.Optional(t.Array(t.String()))
    }),
    statsResponse: t.Object({
        success: t.Boolean(),
        data: t.Object({
            apps: t.Record(t.String(), t.Object({
                appId: t.String(),
                appName: t.String(),
                category: t.Union([
                    t.Literal('productive'),
                    t.Literal('neutral'),
                    t.Literal('distracting'),
                    t.Literal('uncategorized')
                ]),
                autoSuggested: t.Boolean(),
                platforms: t.Array(t.String())
            })),
            hourly: t.Record(t.String(), t.Array(t.Object({
                appId: t.String(),
                timelines: t.Array(t.Object({
                    startTime: t.String(),
                    endTime: t.String(),
                    deviceId: t.String()
                }))
            }))),
            daily: t.Array(t.Object({
                appId: t.String(),
                totalTimeMs: t.Number()
            }))
        })
    }),
    errorResponse: t.Object({
        success: t.Boolean(),
        error: t.String(),
        code: t.Optional(t.String()),
        details: t.Optional(t.Any())
    })
};
