import express from "express";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import Resume from "../models/Resume.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/upload-resume",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      const file = req.file;
      let text = "";

      if (file.mimetype === "application/pdf") {
        const data = await pdf(file.buffer);
        text = data.text;
      } else {
        const result = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        text = result.value;
      }

      await Resume.create({
        userId: req.user.id,
        fileName: file.originalname,
        text,
      });

      res.json({ message: "Resume uploaded successfully" });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

export default router;
