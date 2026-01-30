import axios from "axios";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, {
      filename: "upload",
    });

    const response = await axios.post(
      "https://catbox.moe/user/api.php",
      form,
      { headers: form.getHeaders() }
    );

    const catboxUrl = response.data.trim();
    const fileName = catboxUrl.split("/").pop();

    // 🔥 AUTO DETECT DOMAIN
    const protocol =
      req.headers["x-forwarded-proto"] || "https";
    const domain = `${protocol}://${req.headers.host}`;

    const cdnUrl = `${domain}/${fileName}`;

    res.json({
      success: true,
      cdn_url: cdnUrl,
      origin: catboxUrl
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Upload failed"
    });
  }
}
