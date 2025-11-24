import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  try {
    const databaseId = process.env.NOTION_DB_ID;

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Published",
        checkbox: { equals: true }
      },
      sorts: [{ property: "Date", direction: "descending" }]
    });

    const posts = response.results.map(page => {
      const props = page.properties;

      const readText = p => {
        if (!p) return "";
        if (p.title) return p.title[0]?.plain_text || "";
        if (p.rich_text) return p.rich_text[0]?.plain_text || "";
        return "";
      };

      return {
        id: page.id,
        title: readText(props.Name),
        slug: readText(props.Slug),
        date: props.Date?.date?.start || null,
        excerpt: readText(props.Excerpt),
        cover: props.Cover?.files?.[0]?.file?.url || null
      };
    });

    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
