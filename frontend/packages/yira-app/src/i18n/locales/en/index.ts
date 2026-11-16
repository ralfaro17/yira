import type es from "../es/index.ts"
import common from "./common.ts"
import layout from "./layout.ts"
import status from "./status.ts"
import metrics from "./metrics.ts"
import time from "./time.ts"
import login from "./login.ts"
import welcome from "./welcome.ts"
import home from "./home.ts"
import crew from "./crew.ts"
import scan from "./scan.ts"
import evaluation from "./evaluation.ts"
import notifications from "./notifications.ts"
import protocols from "./protocols.ts"
import profile from "./profile.ts"

const en: typeof es = { common, layout, status, metrics, time, login, welcome, home, crew, scan, evaluation, notifications, protocols, profile }

export default en
