
import { t } from 'elysia';

export const AppsModel = {
    updateCategoryBody: t.Object({
        category: t.Union([
            t.Literal('productive'),
            t.Literal('distracting'),
            t.Literal('neutral'),
            t.Literal('uncategorized')
        ]),
        autoSuggested: t.Optional(t.Boolean())
    }),
    updateCategoryParams: t.Object({
        id: t.String()
    }),
    suggestBody: t.Object({
        appName: t.String()
    }),
    updateCategoryResponse: t.Object({
        success: t.Boolean()
    }),
    suggestResponse: t.Object({
        success: t.Boolean(),
        data: t.Object({
            category: t.Union([
                t.Literal('productive'),
                t.Literal('distracting'),
                t.Literal('neutral'),
                t.Literal('uncategorized')
            ]),
            reason: t.Optional(t.String())
        })
    }),
    errorResponse: t.Object({
        success: t.Boolean(),
        error: t.String(),
        code: t.Optional(t.String()),
        details: t.Optional(t.Any())
    })
};
