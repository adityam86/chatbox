import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const isAudio = req.file.mimetype.startsWith('audio/');
    const isImage = req.file.mimetype.startsWith('image/');

    return res.status(200).json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      type: isAudio ? 'audio' : isImage ? 'image' : 'file',
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Failed to process file upload.' });
  }
});

export default router;
