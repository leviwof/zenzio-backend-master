import { memoryStorage } from 'multer';

export const offerMulterConfig = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
};
