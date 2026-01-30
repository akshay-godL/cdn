import axios from "axios";
import FormData from "form-data";
import Busboy from "busboy";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ---- POST: Upload file ----
  if (req.method === "POST") {
    try {
      const busboy = Busboy({ headers: req.headers });
      let buffer;
      let filename = "upload";

      busboy.on("file", (_, file, info) => {
        filename = info.filename || filename;
        const chunks = [];
        file.on("data", (d) => chunks.push(d));
        file.on("end", () => {
          buffer = Buffer.concat(chunks);
        });
      });

      busboy.on("finish", async () => {
        if (!buffer) return res.status(400).json({ error: "No file" });

        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", buffer, { filename });

        const r = await axios.post(
          "https://catbox.moe/user/api.php",
          form,
          { headers: form.getHeaders() }
        );

        const catboxUrl = r.data.trim();
        const name = catboxUrl.split("/").pop();

        const proto = req.headers["x-forwarded-proto"] || "https";
        const domain = `${proto}://${req.headers.host}`;

        res.json({
          success: true,
          cdn_url: `${domain}/file/${name}`,
          origin: catboxUrl,
        });
      });

      req.pipe(busboy);
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }

    return;
  }

  // ---- GET: Stream file ----
  if (req.method === "GET") {
    try {
      const urlParts = req.url.split("/file/");
      if (urlParts.length < 2) return res.status(400).send("File missing");

      const name = urlParts[1];
      const catboxUrl = `https://files.catbox.moe/${name}`;

      const r = await fetch(catboxUrl, {
        headers: {
          range: req.headers.range || "",
        },
      });

      if (!r.ok && r.status !== 206) return res.status(404).send("Not found");

      res.status(r.status);

      ["content-type", "content-length", "content-range"].forEach((h) => {
        const v = r.headers.get(h);
        if (v) res.setHeader(h, v);
      });

      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      r.body.pipe(res);
    } catch (err) {
      res.status(500).send("Streaming error");
    }

    return;
  }

  res.status(405).send("Method not allowed");
}
