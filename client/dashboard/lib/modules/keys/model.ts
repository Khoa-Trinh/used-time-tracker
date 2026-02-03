import { t } from 'elysia';

export const KeysModel = {
    createBody: t.Object({
        label: t.String()
    }),
    params: t.Object({
        id: t.String()
    })
};
