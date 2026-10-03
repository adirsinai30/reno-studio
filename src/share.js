/* Share a design as a link: the whole state is compressed into the URL hash (#d=...).
   The hash never reaches the server, so nothing is stored anywhere but in the link itself. */

const b64url = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = str => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodeDesign(payload) {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === 'undefined') return 'j' + b64url(raw);
  return 'z' + b64url(await pipe(raw, new CompressionStream('deflate-raw')));
}

export async function decodeDesign(code) {
  const kind = code[0], bytes = unb64url(code.slice(1));
  const raw = kind === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}

export function hashCode() {
  const m = location.hash.match(/^#d=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function shareLink(payload) {
  const code = await encodeDesign(payload);
  return location.origin + location.pathname + '#d=' + code;
}
