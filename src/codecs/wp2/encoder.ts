import wasmUrl from '../../../codecs/wp2/enc/wp2_enc.wasm';

import mainUrlWithMT from 'file-loader!../../../codecs/wp2/enc/wp2_enc_mt.js';
import wasmUrlWithMT from '../../../codecs/wp2/enc/wp2_enc_mt.wasm';
import workerUrl from '../../../codecs/wp2/enc/wp2_enc_mt.worker.js';

import mainUrlWithMTAndSIMD from 'file-loader!../../../codecs/wp2/enc/wp2_enc_mt_simd.js';
import wasmUrlWithMTAndSIMD from '../../../codecs/wp2/enc/wp2_enc_mt_simd.wasm';
import workerUrlWithSIMD from '../../../codecs/wp2/enc/wp2_enc_mt_simd.worker.js';

import { WP2Module } from '../../../codecs/wp2/enc/wp2_enc.js';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule, ModuleFactory } from '../util';
import { simd, threads } from 'wasm-feature-detect';

declare const wp2_enc_mt: ModuleFactory<WP2Module>;
declare const wp2_enc_mt_simd: ModuleFactory<WP2Module>;

let emscriptenModule: Promise<WP2Module>;

async function init() {
  if (await threads()) {
    if (await simd()) {
      importScripts(mainUrlWithMTAndSIMD);
      return initEmscriptenModule<WP2Module>(
        wp2_enc_mt_simd,
        wasmUrlWithMTAndSIMD,
        workerUrlWithSIMD,
        mainUrlWithMTAndSIMD,
      );
    }
    importScripts(mainUrlWithMT);
    return initEmscriptenModule<WP2Module>(
      wp2_enc_mt,
      wasmUrlWithMT,
      workerUrl,
      mainUrlWithMT,
    );
  }
  return initEmscriptenModule(
    (await import('../../../codecs/wp2/enc/wp2_enc.js')).default,
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
