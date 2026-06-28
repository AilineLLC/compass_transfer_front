import { apiPost } from './client';

export type FileType = 'LocationImage' | 'CarImage' | 'TariffIcon' | 'PartnerDocument';

export interface UploadedFileDTO {
  id: string;
  path: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 2;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Разрешены только файлы jpg, jpeg, png, webp';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Размер файла не должен превышать ${MAX_SIZE_MB} МБ`;
  }
  return null;
}

const DOCUMENT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const DOCUMENT_MAX_SIZE_MB = 10;

export function validateDocumentFile(file: File): string | null {
  if (!DOCUMENT_ALLOWED_TYPES.includes(file.type)) {
    return 'Разрешены только файлы PDF, DOC, DOCX, JPG, PNG';
  }
  if (file.size > DOCUMENT_MAX_SIZE_MB * 1024 * 1024) {
    return `Размер файла не должен превышать ${DOCUMENT_MAX_SIZE_MB} МБ`;
  }
  return null;
}

export const filesApi = {
  uploadFile: async (type: FileType, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await apiPost<UploadedFileDTO, FormData>(`/File/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!.id;
  },

  uploadMultiple: async (type: FileType, files: File[]): Promise<string[]> => {
    return Promise.all(files.map(file => filesApi.uploadFile(type, file)));
  },
};
