import { t } from 'elysia';

export const KeysModel = {
    createBody: t.Object({
        label: t.String()
    }),
    params: t.Object({
        id: t.String()
    }),
    getKeysResponse: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
            id: t.String(),
            label: t.Union([t.String(), t.Null()]),
            createdAt: t.Date(),
            lastUsedAt: t.Union([t.Date(), t.Null()])
        }))
    }),
    createKeyResponse: t.Object({
        success: t.Boolean(),
        key: t.String()
    }),
    deleteKeyResponse: t.Object({
        success: t.Boolean()
    }),
    errorResponse: t.Object({
        success: t.Boolean(),
        error: t.String(),
        code: t.Optional(t.String()),
        details: t.Optional(t.Any())
    })
};
