import { Product } from './types';

// Since we cannot access the user's local files directly via the browser without them being in the project folder,
// we assume the user has an 'images' folder with files named after the ID (e.g. 1001.jpg).
// We also provide a fallback to a placeholder service if the local image fails to load (handled in InvoicePreview).

const getProductImage = (id: string) => {
    // Returns a relative path. You must have an "images" folder in your public/root directory.
    // You can change .jpg to .png if your files are pngs.
    return `images/${id}.jpg`;
};

export const PRODUCT_CATALOG: Product[] = [
  { id: '1001', description: 'Xiaomi Mi Band 8', imageUrl: getProductImage('1001') },
  { id: '1002', description: 'Xiaomi Mi TV Box S, 2a Generación', imageUrl: getProductImage('1002') },
  { id: '1004', description: 'Amazon Fire TV HD', imageUrl: getProductImage('1004') },
  { id: '1014', description: 'Amazon Fire TV Stick 4K', imageUrl: getProductImage('1014') },
  { id: '1015', description: 'Echo Dot 5ta Generación', imageUrl: getProductImage('1015') },
  { id: '1013', description: 'Xiaomi Redmi Watch 4', imageUrl: getProductImage('1013') },
  { id: '1025', description: 'CeraVe SA Cleanser 237ml', imageUrl: getProductImage('1025') },
  { id: '1059', description: 'Xiaomi Mi Band 9', imageUrl: getProductImage('1059') },
  { id: '1062', description: 'MagicCubic Proyector Portatil', imageUrl: getProductImage('1062') },
  { id: '1079', description: 'Echo Spot with TP-Link Tapo Smart Color Bulb', imageUrl: getProductImage('1079') },
  { id: '1080', description: 'Xiaomi Redmi Watch 5 Active', imageUrl: getProductImage('1080') },
  { id: '1081', description: 'Xiaomi Redmi Watch 5 Lite', imageUrl: getProductImage('1081') },
  { id: '1110', description: 'Amazon Echo Show 5', imageUrl: getProductImage('1110') },
  { id: '1112', description: 'MagicCubic Proyector Portatil L018 650 ANSI', imageUrl: getProductImage('1112') },
  { id: '1114', description: 'Redmi Buds 6 Lite', imageUrl: getProductImage('1114') },
  { id: '1097', description: '70mai Dash Cam M310 1296P', imageUrl: getProductImage('1097') },
  { id: '1132', description: 'Redmi Watch 5', imageUrl: getProductImage('1132') },
  { id: '1138', description: 'Xiaomi Mi TV Box S, 3a Generación', imageUrl: getProductImage('1138') },
  { id: '1139', description: 'TP-Link - Cámara de seguridad inalámbrica para exteriores, 1080P', imageUrl: getProductImage('1139') },
  { id: '1142', description: 'MagicCubic Proyector Portatil HY450 900 ANSI', imageUrl: getProductImage('1142') },
  { id: '1145', description: 'Amazfit Bip 6', imageUrl: getProductImage('1145') },
  { id: '1153', description: 'Amazfit Active 2 Premium Version', imageUrl: getProductImage('1153') },
  { id: '1154', description: 'Amazfit Active 2', imageUrl: getProductImage('1154') },
  { id: '1164', description: 'MagicCubic Proyector Portatil HY310 330 ANSI', imageUrl: getProductImage('1164') },
  { id: '1169', description: 'Xiaomi Mi Band 10', imageUrl: getProductImage('1169') },
  { id: '1174', description: 'MagicCubic Proyector Portatil HY350MAX 900 ANSI', imageUrl: getProductImage('1174') },
];

export const DEFAULT_EXCHANGE_RATE = 36.6243; 

export const PANDA_STORE_INFO = {
  name: 'pandastore',
  address: ['Reparto San Juan,', 'Managua,', 'Nicaragua - 11027'],
  email: 'pandastorenic@gmail.com',
  phone: '+505 8372 5528'
};

// Default empty, uses LocalStorage
export const DEFAULT_LOGO = "";