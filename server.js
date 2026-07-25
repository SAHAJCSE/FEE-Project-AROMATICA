import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets and pages from the root directory
app.use(express.static(__dirname));

// Fallback for sub-routes if they are requested without .html (though standard HTML links have it)
app.get("/:page", (req, res, next) => {
  const page = req.params.page;
  if (!page.includes(".")) {
    const filePath = path.join(__dirname, `${page}.html`);
    res.sendFile(filePath, (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
