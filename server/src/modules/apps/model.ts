
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
    })
};
