"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  PRESETS,
  addressRole,
  analyze,
  formatOctets,
  maskToPrefix,
  parseAddress,
  prefixToMask,
  type Octets,
} from "@/lib/subnet";
import AndTable from "./AndTable";
import BitStrip from "./BitStrip";
import SplitOctet from "./SplitOctet";
import { BOUNDARY_COLOR, HOST_COLOR, NETWORK_COLOR } from "./colors";

const MARKS = [8, 16, 24, 32].map((v) => ({ value: v, label: `/${v}` }));

export default function Visualizer() {
  const [ip, setIp] = useState<Octets>(PRESETS[0].ip);
  const [prefix, setPrefix] = useState(PRESETS[0].prefix);
  // 入力途中の文字列。正しく読めたときだけ ip / prefix に反映する
  const [ipText, setIpText] = useState(formatOctets(PRESETS[0].ip));
  const [maskText, setMaskText] = useState(formatOctets(prefixToMask(PRESETS[0].prefix)));

  const mask = prefixToMask(prefix);
  const info = analyze(ip, prefix);
  const role = addressRole(ip, info);
  const ipError = parseAddress(ipText.split("/")[0]) === null;
  const parsedMask = parseAddress(maskText);
  const maskError = parsedMask === null ? "0〜255の数を4つ「.」で区切って入力" : maskToPrefix(parsedMask) === null ? "左から1が続く形になっていません" : null;

  function changePrefix(p: number) {
    setPrefix(p);
    setMaskText(formatOctets(prefixToMask(p)));
  }

  function changeIpText(text: string) {
    setIpText(text);
    // 「192.168.1.10/24」の形で入力されたら、マスクも一緒に変える
    const [addr, cidr] = text.split("/");
    const parsed = parseAddress(addr);
    if (parsed) setIp(parsed);
    if (cidr !== undefined && /^\d{1,2}$/.test(cidr.trim()) && Number(cidr) <= 32) changePrefix(Number(cidr));
  }

  function changeMaskText(text: string) {
    setMaskText(text);
    const parsed = parseAddress(text);
    const p = parsed && maskToPrefix(parsed);
    if (p !== null && p !== undefined) setPrefix(p);
  }

  function selectPreset(p: (typeof PRESETS)[number]) {
    setIp(p.ip);
    setIpText(formatOctets(p.ip));
    changePrefix(p.prefix);
  }

  const splitIndex = prefix % 8 !== 0 ? Math.floor(prefix / 8) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <SectionTitle>① アドレスとサブネットマスクを入れる</SectionTitle>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              size="small"
              variant={formatOctets(p.ip) === formatOctets(ip) && p.prefix === prefix ? "filled" : "outlined"}
              color="primary"
              onClick={() => selectPreset(p)}
            />
          ))}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="IPアドレス"
            value={ipText}
            onChange={(e) => changeIpText(e.target.value)}
            error={ipError}
            helperText={ipError ? "0〜255の数を4つ「.」で区切って入力（例：192.168.1.10）" : "「/24」のようにつけるとマスクも変わります"}
            inputProps={{ inputMode: "decimal", spellCheck: false, style: { fontFamily: "monospace", fontSize: "1.1rem" } }}
          />
          <TextField
            label="サブネットマスク"
            value={maskText}
            onChange={(e) => changeMaskText(e.target.value)}
            error={maskError !== null}
            helperText={maskError ?? `プレフィックス長で書くと /${prefix}`}
            inputProps={{ inputMode: "decimal", spellCheck: false, style: { fontFamily: "monospace", fontSize: "1.1rem" } }}
          />
        </Box>
        <Box sx={{ px: { xs: 1, sm: 1.5 }, mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            スライダーでネットワーク部の長さ（/{prefix}）を変えてみよう
          </Typography>
          <Slider
            value={prefix}
            min={0}
            max={32}
            step={1}
            marks={MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `/${v}`}
            onChange={(_, v) => changePrefix(v as number)}
            aria-label="プレフィックス長"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <SectionTitle>② ネットワーク部とホスト部を見る</SectionTitle>
        <Typography
          component="div"
          textAlign="center"
          fontWeight={700}
          sx={{ fontFamily: "monospace", fontSize: { xs: "1.6rem", sm: "2.2rem" }, mb: 0.5, wordBreak: "break-all" }}
        >
          <ColoredDecimal ip={ip} prefix={prefix} />
          <Box component="span" sx={{ color: "text.secondary", fontSize: "0.7em" }}>
            /{prefix}
          </Box>
        </Typography>
        <Legend />
        <BitStrip ip={ip} prefix={prefix} onSelectPrefix={changePrefix} />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          💡 ビットをクリックすると、そこまでがネットワーク部になります。サブネットマスクの「1」の部分がネットワーク部、「0」の部分がホスト部です。
        </Typography>
        {splitIndex !== null && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: "#fafafa", border: 1, borderColor: "divider" }}>
            <SplitOctet value={ip[splitIndex]} index={splitIndex} netBits={prefix - splitIndex * 8} />
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <SectionTitle>③ このネットワークについて</SectionTitle>
        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
            columnGap: 3,
            rowGap: { xs: 0.25, sm: 1 },
            m: 0,
            "& dt": { color: "text.secondary", fontSize: "0.85rem", fontWeight: 700, mt: { xs: 1, sm: 0 } },
            "& dd": { m: 0, fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 700 },
          }}
        >
          <dt>入力したアドレス</dt>
          <dd>
            {formatOctets(ip)} → {role.label}
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "inherit", fontWeight: 400 }}>
              {role.note}
            </Typography>
          </dd>
          <dt>サブネットマスク</dt>
          <dd>
            {formatOctets(mask)}（/{prefix}）
          </dd>
          <dt>ネットワークアドレス</dt>
          <dd style={{ color: NETWORK_COLOR }}>{formatOctets(info.network)}</dd>
          <dt>ブロードキャストアドレス</dt>
          <dd style={{ color: HOST_COLOR }}>{formatOctets(info.broadcast)}</dd>
          <dt>機器に割り当てられる範囲</dt>
          <dd>
            {info.firstHost && info.lastHost ? `${formatOctets(info.firstHost)} 〜 ${formatOctets(info.lastHost)}` : "（下の説明を参照）"}
          </dd>
          <dt>つなげられる機器の数</dt>
          <dd>
            {info.usableHosts.toLocaleString()} 台
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "inherit", fontWeight: 400 }}>
              {info.hostBits >= 2
                ? `ホスト部 ${info.hostBits} ビット → 2^${info.hostBits} = ${(2 ** info.hostBits).toLocaleString()} 通り。そこから「すべて0（ネットワークアドレス）」と「すべて1（ブロードキャストアドレス）」の2つを引きます。`
                : "ホスト部が1ビット以下なので、特別な数え方になります。"}
            </Typography>
          </dd>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <SectionTitle>④ 計算のしかた（AND）</SectionTitle>
        <AndTable ip={ip} mask={mask} network={info.network} broadcast={info.broadcast} prefix={prefix} />
      </Paper>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle1" component="h2" fontWeight={700} sx={{ mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function Legend() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1.5 }}>
      <Typography variant="body2" sx={{ color: NETWORK_COLOR, fontWeight: 700 }}>
        ■ ネットワーク部（どのネットワークか）
      </Typography>
      <Typography variant="body2" sx={{ color: HOST_COLOR, fontWeight: 700 }}>
        ■ ホスト部（どの機器か）
      </Typography>
    </Box>
  );
}

/** 10進数のアドレスを色分けする。境目が途中にあるオクテットは黒字に赤い波線 */
function ColoredDecimal({ ip, prefix }: { ip: Octets; prefix: number }) {
  return (
    <>
      {ip.map((v, o) => {
        const netBits = Math.min(Math.max(prefix - o * 8, 0), 8);
        const style =
          netBits === 8
            ? { color: NETWORK_COLOR }
            : netBits === 0
              ? { color: HOST_COLOR }
              : // 境目がこのオクテットの途中にある（2進数で見ないと分けられない）
                { color: "inherit", textDecoration: `underline wavy ${BOUNDARY_COLOR}`, textUnderlineOffset: "0.2em" };
        return (
          <span key={o}>
            <span style={style}>{v}</span>
            {o < 3 && <span style={{ color: "#999" }}>.</span>}
          </span>
        );
      })}
    </>
  );
}
