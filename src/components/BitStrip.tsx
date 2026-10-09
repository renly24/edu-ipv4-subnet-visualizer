import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { bitsOf, type Octets } from "@/lib/subnet";
import { BOUNDARY_COLOR, HOST_BG, HOST_COLOR, NETWORK_BG, NETWORK_COLOR } from "./colors";

type Props = {
  ip: Octets;
  prefix: number;
  /** ビットをクリックしたとき、そのビットの右側に境界線を動かす */
  onSelectPrefix: (prefix: number) => void;
};

/**
 * 32ビットを8ビットずつ並べ、ネットワーク部（青）とホスト部（オレンジ）で色分けする。
 * 赤い線がネットワーク部とホスト部の境目。
 */
export default function BitStrip({ ip, prefix, onSelectPrefix }: Props) {
  const bits = bitsOf(ip);
  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
          columnGap: { xs: 1, sm: 1.25 },
          rowGap: 1.5,
        }}
      >
        {ip.map((value, o) => {
          const start = o * 8;
          const netBits = Math.min(Math.max(prefix - start, 0), 8);
          const whole = netBits === 8 ? "network" : netBits === 0 ? "host" : "split";
          return (
            <Box key={o}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                sx={{ fontSize: "0.7rem" }}
              >
                第{o + 1}オクテット
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                {bits.slice(start, start + 8).map((bit, j) => {
                  const i = start + j;
                  const isNet = i < prefix;
                  return (
                    <Box
                      key={i}
                      component="button"
                      type="button"
                      onClick={() => onSelectPrefix(i + 1)}
                      title={`ここまでをネットワーク部にする（/${i + 1}）`}
                      aria-label={`${i + 1}ビット目 ${bit}。ここまでをネットワーク部にする`}
                      sx={{
                        all: "unset",
                        cursor: "pointer",
                        textAlign: "center",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: { xs: "0.95rem", sm: "1.05rem" },
                        py: { xs: 0.75, sm: 1 },
                        color: isNet ? NETWORK_COLOR : HOST_COLOR,
                        bgcolor: isNet ? NETWORK_BG : HOST_BG,
                        borderTop: 2,
                        borderBottom: 2,
                        borderColor: isNet ? NETWORK_COLOR : HOST_COLOR,
                        borderLeft: i === prefix && prefix > 0 ? `3px solid ${BOUNDARY_COLOR}` : undefined,
                        borderTopLeftRadius: j === 0 ? 6 : 0,
                        borderBottomLeftRadius: j === 0 ? 6 : 0,
                        borderTopRightRadius: j === 7 ? 6 : 0,
                        borderBottomRightRadius: j === 7 ? 6 : 0,
                        transition: "background-color 0.2s, color 0.2s",
                        "&:hover": { filter: "brightness(0.93)" },
                        "&:focus-visible": { outline: `2px solid ${BOUNDARY_COLOR}`, outlineOffset: 1 },
                      }}
                    >
                      {bit}
                    </Box>
                  );
                })}
              </Box>
              <Typography
                textAlign="center"
                fontWeight={700}
                sx={{
                  mt: 0.25,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  color: whole === "network" ? NETWORK_COLOR : whole === "host" ? HOST_COLOR : "text.primary",
                }}
              >
                {value}
              </Typography>
              {whole === "split" && (
                <Typography variant="caption" display="block" textAlign="center" sx={{ color: BOUNDARY_COLOR, fontWeight: 700 }}>
                  ↑ この中に境目がある
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
      <ProportionBar prefix={prefix} />
    </Box>
  );
}

/** ネットワーク部とホスト部のビット数を、長さの割合で見せる */
function ProportionBar({ prefix }: { prefix: number }) {
  const hostBits = 32 - prefix;
  return (
    <Box sx={{ display: "flex", mt: 1.5, borderRadius: 1, overflow: "hidden", fontWeight: 700, fontSize: "0.8rem" }}>
      {prefix > 0 && (
        <Box
          sx={{
            width: `${(prefix / 32) * 100}%`,
            bgcolor: NETWORK_COLOR,
            color: "#fff",
            py: 0.5,
            px: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "width 0.2s",
          }}
        >
          ネットワーク部 {prefix}ビット
        </Box>
      )}
      {hostBits > 0 && (
        <Box
          sx={{
            flex: 1,
            bgcolor: HOST_COLOR,
            color: "#fff",
            py: 0.5,
            px: 1,
            textAlign: "right",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          ホスト部 {hostBits}ビット
        </Box>
      )}
    </Box>
  );
}
