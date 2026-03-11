import { Product } from './types';

// Función para obtener la ruta de la imagen basada en el ID.
// Se asume que las imágenes están en una carpeta 'images' en la raíz.
const getProductImage = (id: string) => {
    return `images/${id}.jpg`;
};

export const PRODUCT_CATALOG: Product[] = [
  { id: '1004', description: 'Amazon Fire TV HD', imageUrl: getProductImage('1004') },
  { id: '1014', description: 'Amazon Fire TV Stick 4K', imageUrl: getProductImage('1014') },
  { id: '1062', description: 'MagicCubic Proyector Portatil', imageUrl: getProductImage('1062') },
  { id: '1110', description: 'Amazon Echo Show 5', imageUrl: getProductImage('1110') },
  { id: '1112', description: 'MagicCubic Proyector Portatil L018 650 ANSI', imageUrl: getProductImage('1112') },
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
  { id: '1179', description: 'Amazfit Active 2 Premium Square Version', imageUrl: getProductImage('1179') },
  { id: '1185', description: '70mai Dash Cam A800S 4K', imageUrl: getProductImage('1185') },
  { id: '1187', description: 'XGODY N6 Pro 4K Projector Netflix Officially 700 ANSI', imageUrl: getProductImage('1187') },
  { id: '1188', description: 'MagicCubic Proyector Portatil X7 1000 ANSI', imageUrl: getProductImage('1188') },
];

export const DEFAULT_EXCHANGE_RATE = 36.6243; 

export const PANDA_STORE_INFO = {
  name: 'pandastore',
  address: ['Reparto San Juan,', 'Managua,', 'Nicaragua - 11027'],
  email: 'pandastorenic@gmail.com',
  phone: '+505 8372 5528'
};

export const DEFAULT_LOGO = "";
