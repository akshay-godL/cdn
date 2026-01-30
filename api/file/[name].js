export default async function handler(req, res) {
  const { name } = req.query;

  const catboxUrl = `https://files.catbox.moe/${name}`;

  const r = await fetch(catboxUrl, {
    headers: {
      range: req.headers.range || "",
    },
  });

  if (!r.ok && r.status !== 206) {
    return res.status(404).send("Not found");
  }

  res.status(r.status);

  const headersToCopy = [
    "content-type",
    "content-length",
    "content-range",
  ];

  headersToCopy.forEach(h => {
    const v = r.headers.get(h);
    if (v) res.setHeader(h, v);
  });

  res.setHeader(
    "Cache-Control",
    "public, max-age=31536000, immutable"
  );

  r.body.pipe(res);
}
