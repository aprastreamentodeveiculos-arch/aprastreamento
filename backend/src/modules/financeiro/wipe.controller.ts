import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const wipeSafe = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await mongoose.connection.db!.collections();
    let deletadas = [];
    for (let collection of collections) {
      const name = collection.collectionName;
      if (!name.includes('system') && name !== 'usuarios') {
        await collection.drop();
        deletadas.push(name);
      }
    }
    res.json({ success: true, message: 'Dados fakes apagados. Admin mantido.', deletadas });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
