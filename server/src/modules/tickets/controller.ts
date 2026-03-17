import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import * as ticketsService from './service';

export async function getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await ticketsService.getTickets(
      req.query as any,
      req.user!.userId,
      req.user!.role
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketsService.getTicketById(
      parseInt(req.params.id as string),
      req.user!.userId,
      req.user!.role
    );
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketsService.createTicket(req.body, req.user!.userId);
    res.status(201).json({ success: true, message: 'Ticket created', data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketsService.updateTicket(
      parseInt(req.params.id as string),
      req.body,
      req.user!.userId
    );
    res.json({ success: true, message: 'Ticket updated', data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketsService.updateStatus(
      parseInt(req.params.id as string),
      req.body.status,
      req.user!.userId
    );
    res.json({ success: true, message: 'Status updated', data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function assignTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketsService.assignTicket(
      parseInt(req.params.id as string),
      req.body.assignedToId,
      req.user!.userId
    );
    res.json({ success: true, message: 'Ticket assigned', data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await ticketsService.deleteTicket(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
}
