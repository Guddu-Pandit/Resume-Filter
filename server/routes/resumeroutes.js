import express from "express";
import * as pdf from "pdf-parse";
import mammoth from "mammoth";
import Resume from "../models/Resume.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/upload-resume",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      let text = "";

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Only PDF or DOCX files are allowed" });
      }

      /* =======================
         PDF PARSING (Uint8Array)
      ======================== */
      if (file.mimetype === "application/pdf") {
        const uint8Array = new Uint8Array(file.buffer);
        const data = await pdf.default(uint8Array);
        text = data.text;
      } 
      /* =======================
         DOCX PARSING
      ======================== */
      else {
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

      res.status(200).json({ message: "Resume uploaded successfully" });
    } catch (err) {
      console.error("Resume upload error:", err);
      res.status(500).json({
        message: "Upload failed",
        error: err.message,
      });
    }
  }
);

export default router;
