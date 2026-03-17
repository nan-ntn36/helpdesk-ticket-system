/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthenticatedUser } from '../common/types';

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}
