export default async function handler(req, res) {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).send("File not specified");
    }

    const catboxUrl = `https://files.catbox.moe/${file}`;

    const response = await fetch(catboxUrl, {
      headers: {
        // pass range header for video streaming
        range: req.headers.range || ""
      }
    });

    if (!response.ok && response.status !== 206) {
      return res.status(404).send("File not found");
    }

    // Forward important headers
    res.status(response.status);
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") ||
        "application/octet-stream"
    );

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    res.setHeader(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    // 🔥 STREAM IT
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Streaming error");
  }
}
