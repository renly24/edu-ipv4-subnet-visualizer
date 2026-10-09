export const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1] as const;

/** 4つのオクテット（各0〜255） */
export type Octets = [number, number, number, number];

export function toBinary8(n: number): string {
  return n.toString(2).padStart(8, "0");
}

/** 32ビットを「0」「1」の配列にする（左が最上位ビット） */
export function bitsOf(octets: Octets): number[] {
  return octets.map(toBinary8).join("").split("").map(Number);
}

export function toNumber(octets: Octets): number {
  return octets.reduce((acc, o) => acc * 256 + o, 0);
}

export function fromNumber(n: number): Octets {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255) as Octets;
}

export function formatOctets(octets: number[]): string {
  return octets.join(".");
}

/** プレフィックス長（/N）からサブネットマスクを作る */
export function prefixToMask(prefix: number): Octets {
  const n = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return fromNumber(n);
}

/** 左から1が続くサブネットマスクなら1の個数を返す。そうでなければ null */
export function maskToPrefix(mask: Octets): number | null {
  const inverted = (0xffffffff - toNumber(mask)) >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;
  return 32 - Math.log2(inverted + 1);
}

/** 入力欄の文字列を0〜255の整数として読む。読めなければ null */
export function parseOctet(input: string): number | null {
  const s = input.trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  return n <= 255 ? n : null;
}

/** 「192.168.1.10」の形の文字列を読む。読めなければ null */
export function parseAddress(input: string): Octets | null {
  const parts = input.trim().split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map(parseOctet);
  if (octets.some((o) => o === null)) return null;
  return octets as Octets;
}

export type SubnetInfo = {
  prefix: number;
  hostBits: number;
  network: Octets;
  broadcast: Octets;
  /** ホストに割り当てられる最初と最後のアドレス。/31・/32 では null */
  firstHost: Octets | null;
  lastHost: Octets | null;
  /** 割り当てられるホストの数 */
  usableHosts: number;
  /** ホスト部だけを取り出した値（ネットワークの中で何番目か） */
  hostNumber: number;
};

export function analyze(ip: Octets, prefix: number): SubnetInfo {
  const hostBits = 32 - prefix;
  const mask = toNumber(prefixToMask(prefix));
  const ipNum = toNumber(ip);
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const hasRange = hostBits >= 2;
  return {
    prefix,
    hostBits,
    network: fromNumber(network),
    broadcast: fromNumber(broadcast),
    firstHost: hasRange ? fromNumber(network + 1) : null,
    lastHost: hasRange ? fromNumber(broadcast - 1) : null,
    usableHosts: hasRange ? 2 ** hostBits - 2 : hostBits === 1 ? 2 : 1,
    hostNumber: (ipNum - network) >>> 0,
  };
}

/** 入力したIPアドレスがネットワークの中でどんな役割か */
export function addressRole(ip: Octets, info: SubnetInfo): { label: string; note: string } {
  if (info.hostBits < 2) {
    return {
      label: "ホストアドレス",
      note:
        info.hostBits === 1
          ? "/31 は2台だけをつなぐ特別な使い方（ルータどうしの接続など）で、2つのアドレスどちらも機器に割り当てます。"
          : "/32 はたった1つのアドレスだけを表します。",
    };
  }
  const n = toNumber(ip);
  if (n === toNumber(info.network)) {
    return {
      label: "ネットワークアドレス",
      note: "ホスト部がすべて0なので、機器ではなく「ネットワークそのもの」を表します。機器には割り当てられません。",
    };
  }
  if (n === toNumber(info.broadcast)) {
    return {
      label: "ブロードキャストアドレス",
      note: "ホスト部がすべて1なので、ネットワーク内の全機器あてを表します。機器には割り当てられません。",
    };
  }
  return {
    label: "ホストアドレス",
    note: `このネットワークの中の ${info.hostNumber.toLocaleString()} 番目の機器を表すアドレスです。`,
  };
}

/** よく使う例 */
export const PRESETS: { label: string; ip: Octets; prefix: number }[] = [
  { label: "家庭のLAN（/24）", ip: [192, 168, 1, 10], prefix: 24 },
  { label: "学校のLAN（/16）", ip: [172, 16, 5, 20], prefix: 16 },
  { label: "大きな組織（/8）", ip: [10, 1, 2, 3], prefix: 8 },
  { label: "4つに分割（/26）", ip: [192, 168, 1, 100], prefix: 26 },
  { label: "小さく分割（/28）", ip: [192, 168, 10, 45], prefix: 28 },
  { label: "2台だけ（/30）", ip: [203, 0, 113, 5], prefix: 30 },
];

// ───────── 練習問題 ─────────

export type Level = 1 | 2 | 3;

export type Question = {
  level: Level;
  ip: Octets;
  prefix: number;
};

export const LEVELS: { level: Level; title: string; description: string }[] = [
  {
    level: 1,
    title: "レベル1：境目をさがす",
    description: "サブネットマスクを見て、IPアドレスのどこまでがネットワーク部かをクリックで答える",
  },
  {
    level: 2,
    title: "レベル2：ネットワークアドレス",
    description: "ホスト部をすべて0にした「ネットワークアドレス」を答える",
  },
  {
    level: 3,
    title: "レベル3：ブロードキャストアドレス",
    description: "ホスト部をすべて1にした「ブロードキャストアドレス」を答える",
  },
];

export const QUESTIONS_PER_SET = 10;

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** それらしいIPアドレスを作る（プライベートアドレスが中心） */
function randomIp(): Octets {
  const r = Math.random();
  if (r < 0.35) return [192, 168, randomInt(256), 1 + randomInt(254)];
  if (r < 0.55) return [10, randomInt(256), randomInt(256), 1 + randomInt(254)];
  if (r < 0.75) return [172, 16 + randomInt(16), randomInt(256), 1 + randomInt(254)];
  return [1 + randomInt(223), randomInt(256), randomInt(256), 1 + randomInt(254)];
}

function randomPrefix(level: Level): number {
  // レベル1は /8・/16・/24 も多めに、レベル2・3はオクテットの途中で分かれるものを中心に
  const aligned = level === 1 ? 0.35 : 0.25;
  if (Math.random() < aligned) return [8, 16, 24][randomInt(3)];
  let p: number;
  do p = 9 + randomInt(22); // 9〜30
  while (p % 8 === 0);
  return p;
}

export function makeQuestions(level: Level, count = QUESTIONS_PER_SET): Question[] {
  const seen = new Set<string>();
  const list: Question[] = [];
  while (list.length < count) {
    const q = { level, ip: randomIp(), prefix: randomPrefix(level) };
    const key = `${formatOctets(q.ip)}/${q.prefix}`;
    // IPアドレス自体がネットワークアドレス・ブロードキャストアドレスだと答えがそのままになるので避ける
    const info = analyze(q.ip, q.prefix);
    if (info.hostNumber === 0 || info.hostNumber === 2 ** info.hostBits - 1) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(q);
  }
  return list;
}

/** 問題の正解（レベル1はプレフィックス長、レベル2・3はアドレス） */
export function correctAnswer(q: Question): string {
  if (q.level === 1) return `/${q.prefix}`;
  const info = analyze(q.ip, q.prefix);
  return formatOctets(q.level === 2 ? info.network : info.broadcast);
}
