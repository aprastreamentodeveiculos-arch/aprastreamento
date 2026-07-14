import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const wipeAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await mongoose.connection.db!.collections();
    for (let collection of collections) {
      if (!collection.collectionName.includes('system')) {
        await collection.drop();
      }
    }
    res.json({ success: true, message: 'TODOS os dados foram apagados com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
