import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function getBlocks(id) {
  let blocks = [];
  let cursor = undefined;

  while (true) {
    const res = await notion.blocks.children.list({
      block_id: id,
      page_size: 100,
      start_cursor: cursor
    });

    blocks.push(...res.results);

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return blocks;
}

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const databaseId = process.env.NOTION_DB_ID;

    const query = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Slug",
        rich_text: { equals: slug }
      }
    });

    if (!query.results.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    const page = query.results[0];
    const blocks = await getBlocks(page.id);
    const props = page.properties;

    res.status(200).json({
      title: props.Name.title[0].plain_text,
      date: props.Date.date.start,
      excerpt: props.Excerpt.rich_text?.[0]?.plain_text || "",
      cover: props.Cover.files?.[0]?.file?.url || null,
      blocks
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
