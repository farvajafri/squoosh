import wasmUrl from '../../../codecs/jxl/enc/jxl_enc.wasm';

import mainUrlWithMT from 'file-loader!../../../codecs/jxl/enc/jxl_enc_mt.js';
import wasmUrlWithMT from '../../../codecs/jxl/enc/jxl_enc_mt.wasm';
import workerUrl from '../../../codecs/jxl/enc/jxl_enc_mt.worker.js';

import mainUrlWithMTAndSIMD from 'file-loader!../../../codecs/jxl/enc/jxl_enc_mt_simd.js';
import wasmUrlWithMTAndSIMD from '../../../codecs/jxl/enc/jxl_enc_mt_simd.wasm';
import workerUrlWithSIMD from '../../../codecs/jxl/enc/jxl_enc_mt_simd.worker.js';

import { JXLModule } from '../../../codecs/jxl/enc/jxl_enc';

import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule, ModuleFactory } from '../util';
import { simd, threads } from 'wasm-feature-detect';

declare const jxl_enc_mt: ModuleFactory<JXLModule>;
declare const jxl_enc_mt_simd: ModuleFactory<JXLModule>;

let emscriptenModule: Promise<JXLModule>;

async function init() {
  if (await threads()) {
    if (await simd()) {
      importScripts(mainUrlWithMTAndSIMD);
      return initEmscriptenModule<JXLModule>(
        jxl_enc_mt_simd,
        wasmUrlWithMTAndSIMD,
        workerUrlWithSIMD,
        mainUrlWithMTAndSIMD,
      );
    }
    importScripts(mainUrlWithMT);
    return initEmscriptenModule<JXLModule>(
      jxl_enc_mt,
      wasmUrlWithMT,
      workerUrl,
      mainUrlWithMT,
    );
  }
  return initEmscriptenModule(
    (await import('../../../codecs/jxl/enc/jxl_enc.js')).default,
    wasmUrl,
  );
}

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);
  if (!result) {
    throw new Error('Encoding error');
  }

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
