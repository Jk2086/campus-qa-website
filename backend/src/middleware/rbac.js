import { sendError } from '../utils/response.js';

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
        403
      );
    }

    next();
  };
}
