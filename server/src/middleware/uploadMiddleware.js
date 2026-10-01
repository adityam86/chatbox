import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let storage;

if (process.env.STORAGE_PROVIDER === 's3') {
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || (file.mimetype.startsWith('audio/') ? '.webm' : '.jpg');
      cb(null, `uploads/${uniqueSuffix}${ext}`);
    }
  });
} else {
  const uploadDir = path.join(__dirname, '../../uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || (file.mimetype.startsWith('audio/') ? '.webm' : '.jpg');
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only images and audio files are supported.'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter,
});
