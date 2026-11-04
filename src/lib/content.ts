import { getCollection } from 'astro:content';

/** Published projects in hanging order. Drafts are visible in `astro dev` only. */
export const getWorks = async () =>
  (await getCollection('projects', ({ data }) => import.meta.env.DEV || !data.draft)).sort(
    (a, b) => a.data.order - b.data.order,
  );

export const getCrafts = async () => (await getCollection('crafts')).sort((a, b) => a.data.order - b.data.order);

// Active studies first, then completed ones.
export const getStudies = async () =>
  (await getCollection('studying')).sort(
    (a, b) => Number(a.data.status === 'completed') - Number(b.data.status === 'completed') || a.data.order - b.data.order,
  );
