import { createOpenAPIApp } from "../../lib/openapi";
import { authHandlers } from "./auth.handlers";
import {
  loginRoute,
  logoutRoute,
  meRoute,
  refreshRoute,
  registerRoute,
} from "./auth.routes";

const router = createOpenAPIApp();

router.openapi(registerRoute, authHandlers.register);
router.openapi(loginRoute, authHandlers.login);
router.openapi(refreshRoute, authHandlers.refresh);
router.openapi(logoutRoute, authHandlers.logout);
router.openapi(meRoute, authHandlers.me);

export default router;
