import { currentRoute } from "./paths";
const route = currentRoute();
if (route === "/phosphor" || route.startsWith("/phosphor/")) {
  void import("./phosphor/entry");
} else if (route === "/horizon" || route.startsWith("/horizon/")) {
  void import("./horizon/entry");
} else if (route === "/dream" || route.startsWith("/dream/")) {
  void import("./dream/entry");
} else {
  void import("./studio-entry");
}
