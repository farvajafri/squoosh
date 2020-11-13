import wasmUrl from '../../../codecs/webp/enc/webp_enc.wasm';
import wasmUrlWithSIMD from '../../../codecs/webp/enc/webp_enc_simd.wasm';

import { WebPModule } from '../../../codecs/webp/enc/webp_enc.js';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';
import { simd } from 'wasm-feature-detect';

let emscriptenModule: Promise<WebPModule>;

async function init() {
  if (await simd()) {
    return initEmscriptenModule<WebPModule>(
      (await import('../../../codecs/webp/enc/webp_enc_simd.js')).default,
      wasmUrlWithSIMD,
    );
  }
  return initEmscriptenModule<WebPModule>(
    (await import('../../../codecs/webp/enc/webp_enc.js')).default,
    wasmUrl,
  );
}

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);
  if (!result) {
    throw new Error('Encoding error.');
  }
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
