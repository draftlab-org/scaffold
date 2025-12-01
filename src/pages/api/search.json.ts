import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const pages = await getCollection('pages');
const people = await getCollection('people');

const pagesSearch = pages.map((page) => {
  return {
    slug: page.id,
    title: page.data.title,
    description: page.data.description,
  };
});

const peopleSearch = people.map(({ data }) => {
  return data;
});

const searchContent = {
  pages: pagesSearch,
  people: peopleSearch,
};

console.log(searchContent);

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(searchContent));
};
