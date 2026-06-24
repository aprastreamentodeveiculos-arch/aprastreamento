import { Router, Request, Response } from 'express';
import { upload } from '../../config/upload.middleware';

const router = Router();

// Endpoint POST /api/upload para upload de imagem única
router.post('/', upload.single('foto'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    // Retorna a URL pública relativa
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'Upload realizado com sucesso!',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no processamento do upload.', details: error.message });
  }
});

export default router;
