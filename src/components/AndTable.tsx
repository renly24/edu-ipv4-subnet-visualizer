import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatOctets, toBinary8, type Octets } from "@/lib/subnet";
import { HOST_COLOR, NETWORK_COLOR } from "./colors";

type Row = { label: string; octets: Octets; kind: "ip" | "mask" | "result" };

/** 2進数の32ビットを、ネットワーク部・ホスト部で色分けしてドット区切りで表示する */
function ColoredBits({ octets, prefix, kind }: { octets: Octets; prefix: number; kind: Row["kind"] }) {
  const bits = octets.map(toBinary8).join("");
  return (
    <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: { xs: 0, sm: "0.05em" } }}>
      {bits.split("").map((bit, i) => {
        const isNet = i < prefix;
        // マスクの行は 1 と 0 の違いが大事なので、0 を少し薄くする
        const faded = kind === "mask" && bit === "0";
        return (
          <span key={i}>
            <span style={{ color: isNet ? NETWORK_COLOR : HOST_COLOR, opacity: faded ? 0.55 : 1 }}>{bit}</span>
            {i % 8 === 7 && i < 31 && <span style={{ color: "#999" }}>.</span>}
          </span>
        );
      })}
    </Box>
  );
}

/** IPアドレスとサブネットマスクのAND（論理積）でネットワークアドレスを求める様子を見せる */
export default function AndTable({ ip, mask, network, broadcast, prefix }: {
  ip: Octets;
  mask: Octets;
  network: Octets;
  broadcast: Octets;
  prefix: number;
}) {
  const rows: Row[] = [
    { label: "IPアドレス", octets: ip, kind: "ip" },
    { label: "サブネットマスク", octets: mask, kind: "mask" },
  ];
  return (
    <Box sx={{ fontSize: { xs: "0.78rem", sm: "1rem" }, overflowX: "auto" }}>
      {rows.map((r) => (
        <Line key={r.label} label={r.label} octets={r.octets} prefix={prefix} kind={r.kind} />
      ))}
      <Box sx={{ borderTop: 2, borderColor: "text.primary", my: 0.5, maxWidth: 560 }} />
      <Line label="AND → ネットワークアドレス" octets={network} prefix={prefix} kind="result" />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        上下がどちらも1のときだけ1になります（AND）。マスクが1のところはIPアドレスのビットがそのまま残り、0のところは0になります。
      </Typography>
      <Line label="ホスト部をすべて1にする → ブロードキャストアドレス" octets={broadcast} prefix={prefix} kind="result" />
    </Box>
  );
}

function Line({ label, octets, prefix, kind }: { label: string; octets: Octets; prefix: number; kind: Row["kind"] }) {
  return (
    <Box sx={{ mb: 0.75 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" lineHeight={1.3}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 2 }}>
        <ColoredBits octets={octets} prefix={prefix} kind={kind} />
        <Box component="span" sx={{ fontWeight: 700 }}>
          = {formatOctets(octets)}
        </Box>
      </Box>
    </Box>
  );
}
