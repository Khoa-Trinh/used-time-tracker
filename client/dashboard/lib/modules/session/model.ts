
import { t } from 'elysia';

export const SessionModel = {
    logSessionBody: t.Object({
        deviceId: t.String(),
        devicePlatform: t.Union([
            t.Literal('web'),
            t.Literal('windows'),
            t.Literal('macos'),
            t.Literal('linux'),
            t.Literal('android'),
            t.Literal('ios')
        ]),
        appName: t.String(),
        startTime: t.Union([t.String(), t.Date()]), // Allow string ISO or Date object
        endTime: t.Union([t.String(), t.Date()]),
        timeZone: t.String(),
        url: t.Optional(t.String())
    })
};
