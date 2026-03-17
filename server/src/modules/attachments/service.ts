import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../common/errors';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function getAttachments(ticketId: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  return prisma.attachment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function uploadAttachment(
  ticketId: number,
  file: Express.Multer.File
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  // Generate random filename
  const ext = path.extname(file.originalname);
  const randomName = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(UPLOAD_DIR, randomName);

  // Move file
  fs.writeFileSync(filePath, file.buffer);

  return prisma.attachment.create({
    data: {
      fileName: file.originalname,
      filePath: randomName,
      mimeType: file.mimetype,
      fileSize: file.size,
      ticketId,
    },
  });
}

export async function getAttachmentFile(attachmentId: number) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) throw new NotFoundError('Attachment not found');

  const filePath = path.join(UPLOAD_DIR, attachment.filePath);
  if (!fs.existsSync(filePath)) throw new NotFoundError('File not found on disk');

  return { attachment, filePath };
}

export { MAX_FILE_SIZE, ALLOWED_MIMES };
