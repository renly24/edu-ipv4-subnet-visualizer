import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { WEIGHTS, toBinary8 } from "@/lib/subnet";
import { BOUNDARY_COLOR, HOST_BG, HOST_COLOR, NETWORK_BG, NETWORK_COLOR } from "./colors";

/**
 * 境目がオクテットの途中にあるとき（/26 など）、そのオクテットを重みつきで拡大して見せる。
 * 10進数の値が、ネットワーク部の分とホスト部の分にどう分かれるかがわかる。
 */
export default function SplitOctet({ value, index, netBits }: { value: number; index: number; netBits: number }) {
  const bits = toBinary8(value).split("").map(Number);
  const netSum = WEIGHTS.slice(0, netBits).reduce<number>((s, w, i) => s + w * bits[i], 0);
  const hostSum = value - netSum;
  const netTerms = WEIGHTS.slice(0, netBits).filter((_, i) => bits[i] === 1);
  const hostTerms = WEIGHTS.slice(netBits).filter((_, i) => bits[netBits + i] === 1);

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        第{index + 1}オクテット <strong>{value}</strong> は、左{netBits}ビットがネットワーク部、右{8 - netBits}
        ビットがホスト部です。10進数の数字の途中で分かれるので、2進数で考える必要があります。
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", maxWidth: 440 }}>
        {WEIGHTS.map((w, i) => {
          const isNet = i < netBits;
          return (
            <Box
              key={w}
              sx={{
                textAlign: "center",
                py: 0.5,
                bgcolor: isNet ? NETWORK_BG : HOST_BG,
                borderLeft: i === netBits ? `3px solid ${BOUNDARY_COLOR}` : undefined,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                {w}
              </Typography>
              <Typography fontFamily="monospace" fontWeight={700} sx={{ color: isNet ? NETWORK_COLOR : HOST_COLOR, opacity: bits[i] ? 1 : 0.5 }}>
                {bits[i]}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ mt: 1, fontFamily: "monospace", fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>
        <Box sx={{ color: NETWORK_COLOR }}>
          ネットワーク部の分：{netTerms.length ? netTerms.join(" + ") : "0"} = <strong>{netSum}</strong>
        </Box>
        <Box sx={{ color: HOST_COLOR }}>
          ホスト部の分　　　：{hostTerms.length ? hostTerms.join(" + ") : "0"} = <strong>{hostSum}</strong>
        </Box>
        <Box>
          合計 {netSum} + {hostSum} = <strong>{value}</strong>
        </Box>
      </Box>
    </Box>
  );
}
