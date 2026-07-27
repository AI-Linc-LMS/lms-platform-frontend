"use client";

/**
 * A deliberately tiny registry holding the live ProctoringService, with NO TensorFlow imports.
 *
 * Why this exists: `lib/utils/cameraUtils.ts` needs to stop proctoring during camera teardown, and it
 * used to `import { getProctoringService } from "@/lib/services/proctoring.service"` to do it. That
 * one static edge dragged `@tensorflow-models/blazeface` + `@tensorflow/tfjs-*` (~728 kB raw /
 * ~178 kB gzip) into EVERY route, because the root `app/layout.tsx` renders `CameraRouteGuard`, which
 * imports cameraUtils. It also meant a teardown helper CONSTRUCTED a proctoring engine on pages like
 * /jobs, since `getProctoringService()` lazily instantiates the singleton.
 *
 * proctoring.service.ts registers itself here on construction; cameraUtils reads the already-running
 * instance (if any) through this module. Nothing here pulls in a model, so the heavy chunk now loads
 * only on routes that genuinely use proctoring.
 */

/** The only capability cameraUtils needs — kept structural so this file never imports the service. */
export interface StoppableProctoring {
  stopProctoring: () => void;
}

let activeInstance: StoppableProctoring | null = null;

/** Called by proctoring.service.ts when the singleton is created. */
export function setActiveProctoringInstance(instance: StoppableProctoring | null): void {
  activeInstance = instance;
}

/**
 * The running proctoring service, or null when none has ever been started.
 * Never constructs one — that is the whole point.
 */
export function getActiveProctoringInstance(): StoppableProctoring | null {
  return activeInstance;
}
