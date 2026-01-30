import axios from "axios";
import FormData from "form-data";
import Busboy from "busboy";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const busboy = Busboy({ headers: req.headers });
  let buffer;
  let filename = "upload";

  busboy.on("file", (_, file, info) => {
    filename = info.filename || filename;
    const chunks = [];
    file.on("data", d => chunks.push(d));
    file.on("end", () => {
      buffer = Buffer.concat(chunks);
    });
  });

  busboy.on("finish", async () => {
    if (!buffer) {
      return res.status(400).json({ error: "No file" });
    }

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
      url: `${domain}/file/${name}`,
      origin: catboxUrl,
    });
  });

  req.pipe(busboy);
}
