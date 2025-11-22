import type { BlazeFaceModel } from "@tensorflow-models/blazeface";

type TFModule = typeof import("@tensorflow/tfjs");

let tfModulePromise: Promise<TFModule> | null = null;

const loadTensorflow = async (): Promise<TFModule> => {
  if (!tfModulePromise) {
    tfModulePromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");
      if (tf.getBackend() !== "webgl") {
        await tf.setBackend("webgl");
      }
      await tf.ready();
      return tf;
    })();
  }
  return tfModulePromise;
};

export const loadBlazeFaceModel = async (): Promise<BlazeFaceModel> => {
  await loadTensorflow();
  const blazeface = await import("@tensorflow-models/blazeface");
  return blazeface.load();
};

