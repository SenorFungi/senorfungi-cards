// Entry point: import every card here so it ends up in the bundle.
import "./cards/hello-card/hello-card";
import "./cards/matter-pairing-card/matter-pairing-card";

const VERSION = "0.2.0";

console.info(
  `%c SENORFUNGI-CARDS %c ${VERSION} `,
  "color: white; background: #4caf50; font-weight: 700;",
  "color: #4caf50; background: white; font-weight: 700;",
);
